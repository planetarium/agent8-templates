import React, { useState } from 'react';
import { useQualityStore, QualityLevel, QUALITY_CONFIGS } from '../../stores/qualityStore';

const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'SEEDLING',
  medium: 'SAPLING',
  high: 'ANCIENT',
};

const QUALITY_DESCRIPTIONS: Record<QualityLevel, string> = {
  low: 'Max performance. No shadows, reduced detail. For low-end devices.',
  medium: 'Balanced. Shadows on, moderate detail. Good for most devices.',
  high: 'Full fidelity. Rich shadows & detail. For desktop / flagship.',
};

const QUALITY_COLORS: Record<QualityLevel, string> = {
  low: '#c4a265',
  medium: '#8fba6f',
  high: '#6b8f4e',
};

const QualitySettingsMenu: React.FC = () => {
  const { quality, config, setQuality } = useQualityStore();
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
          borderRadius: '8px',
          border: '1px solid rgba(196, 162, 101, 0.25)',
          background: open ? 'rgba(13, 31, 13, 0.95)' : 'rgba(13, 26, 13, 0.8)',
          backdropFilter: 'blur(8px)',
          color: '#c4a265',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(107, 143, 78, 0.1)',
          transition: 'background 0.2s ease, transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          lineHeight: 1,
          fontFamily: "'Cinzel', serif",
        }}
        title="Grove Settings"
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
            background: 'rgba(13, 26, 13, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(196, 162, 101, 0.2)',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 0 40px rgba(107, 143, 78, 0.1)',
            color: '#ccc',
            fontFamily: "'Philosopher', serif",
            maxHeight: 'calc(100vh - max(14px, env(safe-area-inset-top)) - 60px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#c4a265',
              marginBottom: '12px',
              textShadow: '0 0 8px rgba(196,162,101,0.3)',
              fontFamily: "'Cinzel', serif",
            }}
          >
            Grove Settings
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
                    borderRadius: '8px',
                    border: selected ? `1px solid ${color}` : '1px solid rgba(196,162,101,0.08)',
                    background: selected ? `rgba(${hexToRgb(color)}, 0.1)` : 'rgba(255,255,255,0.02)',
                    color: selected ? color : 'rgba(200,200,200,0.6)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border 0.15s',
                    width: '100%',
                    minHeight: 44,
                    fontFamily: "'Philosopher', serif",
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '1px', fontFamily: "'Cinzel', serif" }}>
                      {selected && '~ '}
                      {QUALITY_LABELS[level]}
                    </span>
                    <span style={{ fontSize: '9px', color: 'rgba(200,200,200,0.4)', letterSpacing: '0.5px' }}>
                      DPR:{cfg.dpr.toFixed(2)} | {cfg.shadows ? `SHD:${cfg.shadowMapSize}` : 'SHD:OFF'}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(200,200,200,0.4)', lineHeight: 1.4 }}>
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
                borderRadius: '8px',
                background: 'rgba(196, 162, 101, 0.06)',
                border: '1px solid rgba(196, 162, 101, 0.2)',
                fontSize: '10px',
                color: '#c4a265',
                lineHeight: 1.5,
              }}
            >
              Reload required for full effect.
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'block',
                  marginTop: '6px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(196,162,101,0.3)',
                  background: 'rgba(196,162,101,0.1)',
                  color: '#c4a265',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '2px',
                  minHeight: 36,
                  width: '100%',
                  fontFamily: "'Cinzel', serif",
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
              borderRadius: '6px',
              border: '1px solid rgba(107, 143, 78, 0.15)',
              background: 'rgba(107, 143, 78, 0.04)',
              color: 'rgba(107, 143, 78, 0.5)',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '2px',
              minHeight: 40,
              fontFamily: "'Cinzel', serif",
            }}
          >
            Close
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
