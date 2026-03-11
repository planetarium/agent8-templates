import React, { useEffect, useRef, useState } from 'react';
import { useMiningStore } from '../../stores/miningStore';

/**
 * MiningProgressUI – Volcanic theme
 * Displays a harvesting progress bar when the player is near a fire soul.
 */
const MiningProgressUI: React.FC = () => {
  const miningTargetId = useMiningStore((s) => s.miningTargetId);
  const miningProgress = useMiningStore((s) => s.miningProgress);

  const [visible, setVisible] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (miningTargetId) {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setVisible(true);
    } else {
      fadeTimerRef.current = setTimeout(() => setVisible(false), 350);
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [miningTargetId]);

  if (!visible) return null;

  const isComplete = miningProgress >= 1;
  const pct = Math.round(miningProgress * 100);

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
      }}
    >
      {/* Label */}
      <div
        style={{
          color: isComplete ? '#ffdd44' : '#ffaa66',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: isComplete ? '0 0 12px #ff8800' : '0 0 8px #ff4400',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          transition: 'color 0.2s, text-shadow 0.2s',
        }}
      >
        {isComplete ? 'SOUL HARVESTED!' : 'HARVESTING...'}
      </div>

      {/* Bar container */}
      <div
        style={{
          width: 'clamp(140px, 40vw, 200px)',
          height: '10px',
          borderRadius: '6px',
          background: 'rgba(30, 8, 0, 0.8)',
          border: '1px solid rgba(255, 100, 0, 0.4)',
          backdropFilter: 'blur(6px)',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '6px',
            background: isComplete
              ? 'linear-gradient(90deg, #ffaa00, #ffdd44)'
              : 'linear-gradient(90deg, #cc2200, #ff6600)',
            boxShadow: isComplete ? '0 0 10px #ffaa00' : '0 0 8px #ff4400',
            transition: 'width 0.08s linear, background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>

      {/* Percentage text */}
      <div
        style={{
          color: 'rgba(255, 160, 80, 0.7)',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {pct}%
      </div>
    </div>
  );
};

export default MiningProgressUI;
