import React from 'react';
import { useGameStore } from '../../stores/gameStore';

/**
 * HUDOverlay — in-game HUD showing score, floor, gems, and HP hearts.
 * [CHANGE] Fully redesign colors, icons, and layout to match your concept.
 */
const HUDOverlay: React.FC = () => {
  const { score, floor, playerHp, maxHp, totalGems } = useGameStore();

  return (
    <>
      {/* Top-left: Score */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 100,
          background: 'rgba(13,10,26,0.8)',
          border: '1px solid rgba(176,122,255,0.3)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#b07aff',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: '#7755aa', display: 'block' }}>SCORE</span>
        {score.toLocaleString()}
      </div>

      {/* Top-center: Floor */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(13,10,26,0.8)',
          border: '1px solid rgba(176,122,255,0.3)',
          borderRadius: '8px',
          padding: '6px 16px',
          color: '#b07aff',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: '#7755aa', display: 'block' }}>FLOOR</span>
        {floor}
      </div>

      {/* Top-right: Gems */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 100,
          background: 'rgba(13,10,26,0.8)',
          border: '1px solid rgba(176,122,255,0.3)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#b07aff',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
          textAlign: 'right',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: '#7755aa', display: 'block' }}>GEMS</span>
        ◆ {totalGems}
      </div>

      {/* Bottom-left: HP hearts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          zIndex: 100,
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: maxHp }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: '1.5rem',
              filter: i < playerHp ? 'none' : 'grayscale(1) opacity(0.3)',
              transition: 'filter 0.2s',
            }}
          >
            ♥
          </span>
        ))}
      </div>

      {/* Floor clear hint */}
      {/* Floor banner can be added here by watching enemies.length */}
    </>
  );
};

export default HUDOverlay;
