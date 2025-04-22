import React, { useState, useEffect, RefObject, useRef } from 'react';
import { FlightViewControllerHandle } from 'vibe-starter-3d';
import { useGameServer, useRoomState } from '@agent8/gameserver';

interface StatusDisplayProps {
  controllerRef: RefObject<FlightViewControllerHandle>;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ controllerRef }) => {
  const { server, connected } = useGameServer();
  const { roomId } = useRoomState();
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [hp, setHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [players, setPlayers] = useState(0);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      if (controllerRef.current) {
        // Convert speed from m/s to km/h
        setSpeed(parseFloat((controllerRef.current.speed * 3.6).toFixed(1)));
        setAltitude(parseFloat(controllerRef.current.position.y.toFixed(1)));
      }

      animationId.current = requestAnimationFrame(updateStatus);
    };

    animationId.current = requestAnimationFrame(updateStatus);

    return () => {
      cancelAnimationFrame(animationId.current);
    };
  }, [controllerRef]); // Dependency array includes controllerRef

  useEffect(() => {
    if (!server || !connected || !roomId) return;

    const unsubscribe = server.subscribeRoomState(roomId, (roomState) => {
      setPlayers(roomState.$users.length);
    });

    return () => {
      unsubscribe();
    };
  }, [server, connected, roomId]);

  useEffect(() => {
    if (!server || !connected || !roomId) return;

    const unsubscribe = server.subscribeRoomMyState(roomId, (roomMyState) => {
      if (roomMyState.stats) {
        setHp(roomMyState.stats.currentHp);
        setMaxHp(roomMyState.stats.maxHp);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [server, connected, roomId]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        zIndex: 1, // Ensure UI is on top of the canvas
      }}
    >
      <div>Players: {players}</div>
      <div style={{ color: maxHp > 0 && (hp / maxHp) * 100 <= 30 ? 'red' : 'inherit' }}>Health: {maxHp > 0 ? ((hp / maxHp) * 100).toFixed(0) : 0}%</div>
      <div>Speed: {speed.toFixed(1)} km/h</div>
      <div>Altitude: {altitude.toFixed(1)} m</div>
      <hr style={{ margin: '5px 0' }} />
      <div>Controls:</div>
      <div>W/S: Speed</div>
      <div>A/D: Yaw</div>
      <div>Arrows: Pitch/Roll</div>
    </div>
  );
};
