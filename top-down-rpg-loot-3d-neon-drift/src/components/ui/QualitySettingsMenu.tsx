import React, { useState } from 'react';
import { useQualityStore, QualityLevel, QUALITY_CONFIGS } from '../../stores/qualityStore';

const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'LOW',
  medium: 'MED',
  high: 'MAX',
};

const QUALITY_DESCRIPTIONS: Record<QualityLevel, string> = {
  low: 'Performance mode. No shadows, reduced resolution.',
  medium: 'Balanced. Shadows enabled, moderate resolution.',
  high: 'Maximum fidelity. Full shadows & resolution.',
};

const QUALITY_COLORS: Record<QualityLevel, string> = {
  low: '#ff6600',
  medium: '#ffff00',
  high: '#00ff88',
};

const QualitySettingsMenu: React.FC = () => {
  const { quality, setQuality } = useQualityStore();
  const [open, setOpen] = useState(false);
  const [showReloadHint, setShowReloadHint] = useState(false);

  const handleSelect = (level: QualityLevel) => {
    if (level === quality) return;
    setQuality(level);
    setShowReloadHint(true);
  };

  const levels: QualityLevel[] = ['low', 'medium', 'high'];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          top: 'max(14px, env(safe-area-inset-top))',
          right: 'max(14px, env(safe-area-inset-right))',
          zIndex: 1100,
          width: 40,
          height: 40,
          border: '1px solid rgba(255, 0, 255, 0.3)',
          background: open ? 'rgba(20, 0, 40, 0.95)' : 'rgba(10, 0, 20, 0.8)',
          backdropFilter: 'blur(8px)',
          color: '#ff00ff',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(255,0,255,0.2)',
          transition: 'background 0.2s ease, transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          lineHeight: 1,
          fontFamily: "'Orbitron', system-ui, sans-serif",
        }}
        title="Graphics Settings"
      >
        +
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(max(14px, env(safe-area-inset-top)) + 48px)',
            right: 'max(14px, env(safe-area-inset-right))',
            zIndex: 1099,
            width: 'min(280px, calc(100vw - max(28px, env(safe-area-inset-right)) - 14px))',
            background: 'rgba(10, 0, 20, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 0, 255, 0.25)',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,0,255,0.1)',
            color: '#ccc',
            fontFamily: "'Orbitron', system-ui, sans-serif",
            maxHeight: 'calc(100vh - max(14px, env(safe-area-inset-top)) - 60px)',
            overflowY: 'auto',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255, 0, 255, 0.6)',
              marginBottom: '12px',
            }}
          >
            /// RENDER CONFIG
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {levels.map((level) => {
              const selected = quality === level;
              const color = QUALITY_COLORS[level];
              const cfg = QUALITY_CONFIGS[level];
              return (
                <button
                  key={level}
                  onClick={() => handleSelect(level)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: selected ? `1px solid ${color}66` : '1px solid rgba(255,0,255,0.1)',
                    background: selected ? `rgba(${hexToRgb(color)}, 0.1)` : 'rgba(255,255,255,0.02)',
                    color: selected ? color : 'rgba(200,200,200,0.6)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border 0.15s',
                    width: '100%',
                    minHeight: 44,
                    fontFamily: "'Orbitron', system-ui, sans-serif",
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '2px' }}>
                      {selected && '> '}{QUALITY_LABELS[level]}
                    </span>
                    <span style={{ fontSize: '8px', color: 'rgba(0,255,255,0.4)', letterSpacing: '1px' }}>
                      DPR x{cfg.dpr.toFixed(2)} | {cfg.shadows ? `SHD ${cfg.shadowMapSize}` : 'NO SHD'}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(200,200,200,0.4)', lineHeight: 1.4, letterSpacing: '0.5px' }}>
                    {QUALITY_DESCRIPTIONS[level]}
                  </div>
                </button>
              );
            })}
          </div>

          {showReloadHint && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(255, 100, 0, 0.1)',
                border: '1px solid rgba(255, 100, 0, 0.3)',
                fontSize: '9px',
                color: '#ff8844',
                lineHeight: 1.5,
                letterSpacing: '1px',
              }}
            >
              /// RELOAD REQUIRED
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'block',
                  marginTop: '6px',
                  padding: '4px 12px',
                  border: '1px solid rgba(255,100,0,0.4)',
                  background: 'rgba(255,100,0,0.15)',
                  color: '#ff8844',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '2px',
                  minHeight: 36,
                  width: '100%',
                  fontFamily: "'Orbitron', system-ui, sans-serif",
                }}
              >
                RELOAD
              </button>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '14px',
              padding: '7px',
              border: '1px solid rgba(255,0,255,0.15)',
              background: 'rgba(255,0,255,0.04)',
              color: 'rgba(200,200,200,0.4)',
              fontSize: '10px',
              cursor: 'pointer',
              letterSpacing: '2px',
              minHeight: 40,
              fontFamily: "'Orbitron', system-ui, sans-serif",
            }}
          >
            CLOSE
          </button>
        </div>
      )}
    </>
  );
};

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default QualitySettingsMenu;
