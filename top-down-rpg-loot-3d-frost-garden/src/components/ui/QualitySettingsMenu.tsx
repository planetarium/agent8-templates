import React, { useState } from 'react';
import { useQualityStore, QualityLevel, QUALITY_CONFIGS } from '../../stores/qualityStore';

const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const QUALITY_DESCRIPTIONS: Record<QualityLevel, string> = {
  low: 'Best performance. No shadows, reduced resolution. Recommended for older / low-end mobile.',
  medium: 'Balanced. Shadows enabled, moderate resolution. Good for most smartphones.',
  high: 'Best visuals. Full shadows & resolution. Recommended for desktop / flagship phones.',
};

const QUALITY_COLORS: Record<QualityLevel, string> = {
  low: '#66aacc',
  medium: '#55bbdd',
  high: '#88ddff',
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
      {/* Settings toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          top: 'max(14px, env(safe-area-inset-top))',
          right: 'max(14px, env(safe-area-inset-right))',
          zIndex: 1100,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(130, 200, 255, 0.25)',
          background: open ? 'rgba(10, 25, 50, 0.95)' : 'rgba(10, 20, 45, 0.75)',
          backdropFilter: 'blur(8px)',
          color: '#88ccff',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'background 0.2s ease, transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          lineHeight: 1,
        }}
        title="Graphics Settings"
      >
        &#x2699;
      </button>

      {/* Settings panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(max(14px, env(safe-area-inset-top)) + 48px)',
            right: 'max(14px, env(safe-area-inset-right))',
            zIndex: 1099,
            width: 'min(280px, calc(100vw - max(28px, env(safe-area-inset-right)) - 14px))',
            background: 'rgba(8, 16, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(130, 200, 255, 0.2)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            color: '#aaddff',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            maxHeight: 'calc(100vh - max(14px, env(safe-area-inset-top)) - 60px)',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'rgba(130, 200, 255, 0.6)',
              marginBottom: '12px',
            }}
          >
            Graphics Quality
          </div>

          {/* Quality buttons */}
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
                    borderRadius: '10px',
                    border: selected ? `1px solid ${color}66` : '1px solid rgba(130,200,255,0.1)',
                    background: selected ? `rgba(${hexToRgb(color)}, 0.12)` : 'rgba(255,255,255,0.02)',
                    color: selected ? color : 'rgba(180,220,255,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border 0.15s',
                    width: '100%',
                    minHeight: 44,
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
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>
                      {selected && '\u25CF '}
                      {QUALITY_LABELS[level]}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'rgba(130,200,255,0.4)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      DPR \u00d7{cfg.dpr.toFixed(2)} \u00b7 {cfg.shadows ? `Shadow ${cfg.shadowMapSize}` : 'No Shadow'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(130,200,255,0.4)', lineHeight: 1.4 }}>
                    {QUALITY_DESCRIPTIONS[level]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reload hint */}
          {showReloadHint && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(60, 140, 220, 0.1)',
                border: '1px solid rgba(100, 180, 255, 0.3)',
                fontSize: '11px',
                color: '#88ccff',
                lineHeight: 1.5,
              }}
            >
              Reload the page to fully apply the new quality setting.
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'block',
                  marginTop: '6px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(100,180,255,0.3)',
                  background: 'rgba(60,140,220,0.15)',
                  color: '#88ccff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  minHeight: 36,
                  width: '100%',
                }}
              >
                Reload Now
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '14px',
              padding: '7px',
              borderRadius: '8px',
              border: '1px solid rgba(130,200,255,0.15)',
              background: 'rgba(60,140,220,0.06)',
              color: 'rgba(130,200,255,0.5)',
              fontSize: '12px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              minHeight: 40,
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

/** Utility: convert hex color to R,G,B string for rgba() */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default QualitySettingsMenu;
