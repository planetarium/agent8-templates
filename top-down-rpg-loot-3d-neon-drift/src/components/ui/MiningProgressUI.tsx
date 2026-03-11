import React, { useEffect, useRef, useState } from 'react';
import { useHackingStore } from '../../stores/miningStore';

const HackingProgressUI: React.FC = () => {
  const hackingTargetId = useHackingStore((s) => s.hackingTargetId);
  const hackingProgress = useHackingStore((s) => s.hackingProgress);

  const [visible, setVisible] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hackingTargetId) {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setVisible(true);
    } else {
      fadeTimerRef.current = setTimeout(() => setVisible(false), 350);
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [hackingTargetId]);

  if (!visible) return null;

  const isComplete = hackingProgress >= 1;
  const pct = Math.round(hackingProgress * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(28% + max(16px, env(safe-area-inset-bottom)))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        fontFamily: "'Orbitron', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          color: isComplete ? '#00ff88' : '#00ffff',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: isComplete ? '0 0 12px #00ff88' : '0 0 8px #00ffff',
          transition: 'color 0.2s, text-shadow 0.2s',
        }}
      >
        {isComplete ? '/// EXTRACTED' : '/// HACKING...'}
      </div>

      <div
        style={{
          width: 'clamp(140px, 40vw, 220px)',
          height: '6px',
          background: 'rgba(10, 0, 20, 0.8)',
          border: '1px solid rgba(255, 0, 255, 0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: isComplete
              ? 'linear-gradient(90deg, #00ff88, #00ffcc)'
              : 'linear-gradient(90deg, #ff00ff, #00ffff)',
            boxShadow: isComplete ? '0 0 10px #00ff88' : '0 0 8px #ff00ff',
            transition: 'width 0.08s linear, background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>

      <div
        style={{
          color: 'rgba(0, 255, 255, 0.5)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '2px',
        }}
      >
        {pct}%
      </div>
    </div>
  );
};

export default HackingProgressUI;
