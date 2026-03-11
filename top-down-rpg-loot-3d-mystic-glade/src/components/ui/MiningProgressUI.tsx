import React, { useEffect, useRef, useState } from 'react';
import { useMiningStore } from '../../stores/miningStore';

/**
 * MiningProgressUI
 * Displays a mining progress bar when the player is near a crystal.
 * Positioned at the bottom-center, above the joystick area.
 * Uses a CSS variable (--joystick-height) or a safe percentage-based offset
 * to avoid overlapping the virtual joystick on mobile.
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
        /*
         * Keep the bar above the virtual joystick.
         * The joystick UI sits roughly in the bottom 28% of the screen on mobile.
         * Using 30% from the bottom provides a comfortable gap on all screen sizes.
         * On desktop where there is no joystick, 30% still looks fine.
         */
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
          color: isComplete ? '#ffb8e0' : '#b8ffd0',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: isComplete ? '0 0 12px #ff44aa' : '0 0 8px #44ff88',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          transition: 'color 0.2s, text-shadow 0.2s',
        }}
      >
        {isComplete ? '✓ Gathered!' : '🌿 FORAGING…'}
      </div>

      {/* Bar container */}
      <div
        style={{
          width: 'clamp(140px, 40vw, 200px)',
          height: '10px',
          borderRadius: '6px',
          background: 'rgba(10, 20, 50, 0.75)',
          border: '1px solid rgba(100, 160, 255, 0.35)',
          backdropFilter: 'blur(6px)',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '6px',
            background: isComplete
              ? 'linear-gradient(90deg, #ff44aa, #ff88cc)'
              : 'linear-gradient(90deg, #22aa44, #66ff88)',
            boxShadow: isComplete ? '0 0 10px #ff44aa' : '0 0 8px #22aa44',
            transition: 'width 0.08s linear, background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>

      {/* Percentage text */}
      <div
        style={{
          color: 'rgba(180, 210, 255, 0.7)',
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
