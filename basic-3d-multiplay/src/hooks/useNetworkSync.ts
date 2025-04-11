import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameServer } from '@agent8/gameserver';

const PING_INTERVAL_MS = 1000; // Ping every 5 seconds
const RTT_HISTORY_LENGTH = 3; // Number of RTT values to keep for averaging

interface PongResponse {
  clientPingTime: number;
  serverPongTime: number;
}

/**
 * Custom hook for measuring network latency (RTT) with the game server.
 * Periodically sends pings to the server and calculates the Round Trip Time (RTT)
 * based on the pong response.
 *
 * @param server The GameServer instance.
 * @returns An object containing the current RTT in milliseconds, or null if not available.
 */
export function useNetworkSync(server: GameServer | null) {
  const [rttHistory, setRttHistory] = useState<number[]>([]); // Store last N RTT values (ms)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Ref for timeout ID

  const sendPing = useCallback(async () => {
    // Only proceed if server exists
    if (!server) {
      return;
    }

    const clientPingTime = performance.now(); // Use high-resolution timestamp

    try {
      // Call the remote function 'handlePing' on the server
      const response = (await server.remoteFunction('handlePing', [clientPingTime], {
        needResponse: true,
      })) as PongResponse | null;
      const clientPongTime = performance.now();

      if (response && response.clientPingTime === clientPingTime) {
        // Calculate RTT if the response matches the ping request
        const currentRtt = clientPongTime - response.clientPingTime;
        // Update RTT history state
        setRttHistory((prevHistory) => {
          const newHistory = [...prevHistory, currentRtt];
          // Keep only the last RTT_HISTORY_LENGTH values
          return newHistory.slice(-RTT_HISTORY_LENGTH);
        });
      } else {
        // Response mismatch or null, clear history
        setRttHistory([]);
      }
    } catch (error) {
      // Clear history on error
      setRttHistory([]);
    }
  }, [server]); // Depends only on server connection status

  useEffect(() => {
    // Clear any existing timeout when effect runs or cleans up
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (server) {
      const runPingCycle = async () => {
        await sendPing();
        // Schedule the next ping only if the server is still connected
        if (server) {
          timeoutRef.current = setTimeout(runPingCycle, PING_INTERVAL_MS);
        } else {
          setRttHistory([]);
        }
      };

      // Start the first ping cycle using setTimeout to avoid double execution in StrictMode
      timeoutRef.current = setTimeout(runPingCycle, 0);

      // Cleanup function to clear timeout when component unmounts or server changes
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else {
      // Ensure RTT history is cleared when server is disconnected
      setRttHistory([]);
    }
  }, [server, sendPing]); // Effect depends on server connection and the sendPing function

  // Calculate the average RTT from the history
  const averageRtt = useMemo(() => {
    if (rttHistory.length === 0) {
      return null;
    }
    const sum = rttHistory.reduce((acc, val) => acc + val, 0);
    return sum / rttHistory.length;
  }, [rttHistory]);

  return { rtt: averageRtt }; // Return the average RTT
}
