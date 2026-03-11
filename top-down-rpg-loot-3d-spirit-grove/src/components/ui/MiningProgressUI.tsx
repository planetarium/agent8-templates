import React, { useEffect, useRef, useState } from 'react';
import { useMiningStore } from '../../stores/miningStore';

/**
 * MiningProgressUI - Spirit Grove style
 * Displays a spirit channeling progress bar when near a Spirit Rune.
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
        fontFamily: "'Cinzel', serif",
      }}
    >
      {/* Label */}
      <div
        style={{
          color: isComplete ? '#6b8f4e' : '#c4a265',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: isComplete ? '0 0 15px rgba(107,143,78,0.6)' : '0 0 10px rgba(196,162,101,0.5)',
          transition: 'color 0.2s, text-shadow 0.2s',
        }}
      >
        {isComplete ? 'Rune Absorbed' : 'Channeling...'}
      </div>

      {/* Bar container */}
      <div
        style={{
          width: 'clamp(140px, 40vw, 200px)',
          height: '6px',
          borderRadius: '4px',
          background: 'rgba(13, 26, 13, 0.8)',
          border: '1px solid rgba(196, 162, 101, 0.25)',
          overflow: 'hidden',
          boxShadow: '0 0 12px rgba(107, 143, 78, 0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '4px',
            background: isComplete
              ? 'linear-gradient(90deg, #6b8f4e, #8fba6f)'
              : 'linear-gradient(90deg, #c4a265, #6b8f4e)',
            boxShadow: isComplete ? '0 0 12px rgba(107,143,78,0.5)' : '0 0 10px rgba(196,162,101,0.4)',
            transition: 'width 0.08s linear, background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>

      {/* Percentage */}
      <div
        style={{
          color: 'rgba(196, 162, 101, 0.5)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '2px',
          fontFamily: "'Philosopher', serif",
        }}
      >
        {pct}%
      </div>
    </div>
  );
};

export default MiningProgressUI;
