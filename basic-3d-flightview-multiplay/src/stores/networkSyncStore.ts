import { GameServer } from '@agent8/gameserver';
import { create } from 'zustand';

const PING_INTERVAL_MS = 3000; // Ping interval in milliseconds
const RTT_HISTORY_LENGTH = 5; // Number of RTT values to keep for averaging

interface PongResponse {
  clientPingTime: number;
  serverPongTime: number;
}

interface NetworkState {
  rttHistory: number[]; // Array of recent RTT measurements (max RTT_HISTORY_LENGTH entries)
  server: GameServer | null;
  rtt: number | null; // Average RTT value calculated from rttHistory
  isActive: boolean; // Synchronization active state

  // Actions
  setServer: (server: GameServer | null) => void;
  startSync: () => void;
  stopSync: () => void;
  addRttValue: (rtt: number) => void;
  calculateRtt: () => number | null; // Manual RTT calculation function
}

/**
 * Zustand store for managing network RTT (Round Trip Time) state
 * - Stores up to 5 recent RTT measurements and calculates average
 * - When 5 values are collected, highest and lowest values are excluded from average
 * - Shares RTT data across components to prevent duplicate measurements
 *
 * Usage example:
 * ```tsx
 * // How to use in a component
 * const Component = () => {
 *   const { server } = useGameServer();
 *   const rtt = useNetworkStore((state) => state.rtt);
 *
 *   // Set server when component mounts, cleanup when unmounts
 *   useEffect(() => {
 *     useNetworkStore.getState().setServer(server);
 *
 *     return () => {
 *       useNetworkStore.getState().setServer(null);
 *     };
 *   }, [server]);
 *
 *   return <div>RTT: {rtt ? `${rtt.toFixed(2)}ms` : 'Measuring...'}</div>;
 * };
 * ```
 */
export const networkSyncStore = create<NetworkState>((set, get) => {
  // Timeout reference - stored outside the store
  let pingTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Calculate average RTT value (internal use)
   * @param rttHistory Array of RTT measurements
   * @returns Average RTT value or null if no values
   */
  const calculateRttValue = (rttHistory: number[]): number | null => {
    if (rttHistory.length === 0) return null;

    // If 5 or more values exist, exclude max/min values from average
    if (rttHistory.length >= 5) {
      // Sort the RTT array
      const sortedRtt = [...rttHistory].sort((a, b) => a - b);

      // Exclude min value (index 0) and max value (last index)
      const filteredRtt = sortedRtt.slice(1, -1);

      // Calculate average of remaining 3 values
      const sum = filteredRtt.reduce((acc, val) => acc + val, 0);
      return sum / filteredRtt.length;
    } else {
      // For fewer than 5 values, calculate normal average
      const sum = rttHistory.reduce((acc, val) => acc + val, 0);
      return sum / rttHistory.length;
    }
  };

  // Store definition
  return {
    rttHistory: [],
    server: null,
    rtt: null,
    isActive: false,

    // Calculate RTT function (external use)
    calculateRtt: () => {
      return calculateRttValue(get().rttHistory);
    },

    // Set server action
    setServer: (server) => {
      const prevServer = get().server;
      set({ server });

      // Manage sync state when server changes
      if (!prevServer && server) {
        // New server connected
        get().startSync();
      } else if (prevServer && !server) {
        // Server disconnected
        get().stopSync();
      }
    },

    // Add RTT value and update average RTT
    addRttValue: (rtt) => {
      // Add new value to history and limit to max length
      const newHistory = [...get().rttHistory, rtt].slice(-RTT_HISTORY_LENGTH);

      // Calculate new average RTT
      const newRtt = calculateRttValue(newHistory);

      // Update state
      set({ rttHistory: newHistory, rtt: newRtt });
    },

    // Start synchronization
    startSync: () => {
      const { server, isActive } = get();

      // Ignore if already active or no server
      if (isActive || !server) {
        return;
      }

      // Set active state
      set({ isActive: true });

      // Define ping function
      const sendPing = async () => {
        const { server, isActive } = get();
        if (!server || !isActive) return;

        const clientPingTime = performance.now();

        try {
          // Send ping request to server
          const response = (await server.remoteFunction('handlePing', [clientPingTime], {
            needResponse: true,
          })) as PongResponse | null;

          const clientPongTime = performance.now();

          if (response && response.clientPingTime === clientPingTime) {
            // Calculate and store RTT (round trip time)
            const currentRtt = clientPongTime - response.clientPingTime;
            get().addRttValue(currentRtt);
          }
        } catch (error) {
          // Ping failed, no action needed
        }

        // Schedule next ping (if still active)
        const currentState = get();
        if (currentState.isActive && currentState.server) {
          pingTimeout = setTimeout(sendPing, PING_INTERVAL_MS);
        }
      };

      // Start first ping
      pingTimeout = setTimeout(sendPing, 0);
    },

    // Stop synchronization
    stopSync: () => {
      // Clear timeout
      if (pingTimeout) {
        clearTimeout(pingTimeout);
        pingTimeout = null;
      }

      // Reset state
      set({
        isActive: false,
        rttHistory: [],
        rtt: null,
      });
    },
  };
});
