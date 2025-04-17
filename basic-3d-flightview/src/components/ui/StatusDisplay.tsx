import React, { useState, useEffect, RefObject } from 'react';
import { FlightViewControllerHandle } from 'vibe-starter-3d';

interface StatusDisplayProps {
  controllerRef: RefObject<FlightViewControllerHandle>;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ controllerRef }) => {
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (controllerRef.current) {
        setSpeed(parseFloat(controllerRef.current.speed.toFixed(1)));
        setAltitude(parseFloat(controllerRef.current.position.y.toFixed(1)));
      }
    }, 100); // Update UI every 100ms

    return () => clearInterval(interval);
  }, [controllerRef]); // Dependency array includes controllerRef

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        zIndex: 1, // Ensure UI is on top of the canvas
      }}
    >
      <div>Speed: {speed.toFixed(1)}</div>
      <div>Altitude: {altitude.toFixed(1)}</div>
      <hr style={{ margin: '5px 0' }} />
      <div>Controls:</div>
      <div>W/S: Speed</div>
      <div>A/D: Yaw</div>
      <div>Arrows: Pitch/Roll</div>
    </div>
  );
};
