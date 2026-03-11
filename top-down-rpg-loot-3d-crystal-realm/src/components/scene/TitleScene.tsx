import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameServer, useAsset } from '@agent8/gameserver';

interface TitleSceneProps {
  onStart: () => void;
}

const TitleScene: React.FC<TitleSceneProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [exchangeHovered, setExchangeHovered] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);

  const { connected, server } = useGameServer();
  const { getAsset } = useAsset();
  const crystalCount = getAsset('crystal') ?? 0;

  const openCrossRampShop = useCallback(async () => {
    if (!connected || !server || shopLoading) return;
    setShopLoading(true);
    try {
      const url = await server.getCrossRampShopUrl('en');
      window.open(url, 'CrossRampShop', 'width=1024,height=768');
    } catch (error) {
      console.error('Failed to open CROSS Mini Hub:', error);
    } finally {
      setShopLoading(false);
    }
  }, [connected, server, shopLoading]);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate floating particles (stable - not random on each render)
  const particles = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: 2 + (i * 7 % 5),
      x: (i * 37 + 11) % 100,
      duration: 6 + (i * 13 % 8),
      delay: (i * 19) % 6,
      opacity: 0.2 + (i * 11 % 6) * 0.08,
      hue: 200 + (i * 17 % 60),
    }))
  ).current;

  const handleStart = () => {
    setVisible(false);
    setTimeout(() => onStart(), 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0015 0%, #130025 30%, #1a0035 60%, #0d1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        /* safe-area insets for mobile notch */
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        boxSizing: 'border-box',
      }}
    >
      {/* Starfield */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 1 + (i % 2),
              height: 1 + (i % 2),
              borderRadius: '50%',
              background: 'white',
              left: `${(i * 43 + 7) % 100}%`,
              top: `${(i * 61 + 13) % 100}%`,
              opacity: 0.1 + (i % 7) * 0.1,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating crystal particles */}
      <div ref={particlesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              background: `hsl(${p.hue}, 100%, 70%)`,
              borderRadius: '50%',
              left: `${p.x}%`,
              bottom: '-10px',
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 100%, 70%)`,
              animation: `floatUp ${p.duration}s ease-in infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Background glow orbs */}
      <div
        style={{
          position: 'absolute',
          width: '80vw',
          height: '80vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100, 0, 255, 0.15) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main content card (scrollable on very small screens) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '24px 16px',
          boxSizing: 'border-box',
          gap: 0,
        }}
      >
        {/* Crystal icon decoration */}
        <div style={{ marginBottom: 12, animation: 'floatBob 3s ease-in-out infinite', flexShrink: 0 }}>
          <svg width="56" height="70" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
              points="32,2 58,24 50,72 14,72 6,24"
              fill="url(#crystalGrad)"
              stroke="rgba(150,220,255,0.8)"
              strokeWidth="1.5"
            />
            <polygon points="32,2 58,24 32,20" fill="rgba(200,240,255,0.4)" />
            <polygon points="32,2 6,24 32,20" fill="rgba(150,200,255,0.3)" />
            <line x1="32" y1="2" x2="32" y2="72" stroke="rgba(200,240,255,0.5)" strokeWidth="1" />
            <defs>
              <linearGradient id="crystalGrad" x1="0" y1="0" x2="64" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a0d8ef" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#5b9bd5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2d4a7a" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 6, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-20px -40px',
              background: 'radial-gradient(ellipse, rgba(100, 60, 255, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 10vw, 4.5rem)',
              fontWeight: 900,
              letterSpacing: '0.05em',
              background: 'linear-gradient(180deg, #e8d5ff 0%, #b090ff 40%, #7040d0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1.1,
              fontFamily: '"Georgia", "Times New Roman", serif',
              filter: 'drop-shadow(0 0 20px rgba(160, 100, 255, 0.6))',
            }}
          >
            REALM
          </h1>
          <h1
            style={{
              fontSize: 'clamp(1rem, 4vw, 1.8rem)',
              fontWeight: 400,
              letterSpacing: '0.4em',
              background: 'linear-gradient(180deg, #c0e8ff 0%, #80b8e8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '4px 0 0 0',
              fontFamily: '"Georgia", "Times New Roman", serif',
              filter: 'drop-shadow(0 0 10px rgba(100, 180, 255, 0.5))',
            }}
          >
            OF RELICS
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            color: 'rgba(180, 200, 255, 0.7)',
            fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
            letterSpacing: '0.2em',
            marginTop: 0,
            marginBottom: 20,
            fontFamily: 'Georgia, serif',
            textAlign: 'center',
          }}
        >
          COLLECT · EXPLORE · TRANSCEND
        </p>

        {/* Decorative divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ width: 50, height: 1, background: 'linear-gradient(to right, transparent, rgba(160,120,255,0.6))' }} />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(200,160,255,0.8)',
              boxShadow: '0 0 8px rgba(200,160,255,0.8)',
            }}
          />
          <div style={{ width: 50, height: 1, background: 'linear-gradient(to left, transparent, rgba(160,120,255,0.6))' }} />
        </div>

        {/* Crystal count badge (above the start button) */}
        {connected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: 16,
              background: 'rgba(5, 10, 30, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(100, 160, 255, 0.3)',
              borderRadius: '40px',
              padding: '6px 16px 6px 10px',
              boxShadow: '0 0 16px rgba(80, 140, 255, 0.15)',
            }}
          >
            <svg viewBox="0 0 36 36" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="tcg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#aaddff" />
                  <stop offset="50%" stopColor="#4488ff" />
                  <stop offset="100%" stopColor="#8844cc" />
                </linearGradient>
              </defs>
              <polygon points="18,2 28,12 18,34 8,12" fill="url(#tcg1)" />
              <polygon points="18,2 28,12 18,18" fill="white" opacity="0.25" />
              <ellipse cx="14" cy="10" rx="3" ry="2" fill="white" opacity="0.4" transform="rotate(-20 14 10)" />
            </svg>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#e8f4ff',
                letterSpacing: '1px',
                textShadow: '0 0 8px rgba(100,160,255,0.5)',
                minWidth: '20px',
                textAlign: 'center',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            >
              {crystalCount}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'rgba(160, 200, 255, 0.7)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Crystals
            </span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            position: 'relative',
            padding: '13px 44px',
            fontSize: 'clamp(0.85rem, 3vw, 1rem)',
            fontWeight: 700,
            letterSpacing: '0.25em',
            color: buttonHovered ? '#ffffff' : '#d0b8ff',
            background: buttonHovered
              ? 'linear-gradient(135deg, rgba(120, 60, 255, 0.8) 0%, rgba(60, 120, 255, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(80, 30, 180, 0.5) 0%, rgba(30, 80, 180, 0.5) 100%)',
            border: `1px solid ${buttonHovered ? 'rgba(180, 140, 255, 0.9)' : 'rgba(140, 100, 255, 0.5)'}`,
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            fontFamily: 'Georgia, serif',
            boxShadow: buttonHovered
              ? '0 0 30px rgba(120, 80, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.05)'
              : '0 0 15px rgba(80, 40, 200, 0.3)',
            transform: buttonHovered ? 'scale(1.05)' : 'scale(1)',
            marginBottom: 12,
            minWidth: 200,
            /* larger tap target on mobile */
            minHeight: 48,
          }}
        >
          ENTER THE REALM
        </button>

        {/* Exchange Button */}
        <button
          onClick={openCrossRampShop}
          onMouseEnter={() => setExchangeHovered(true)}
          onMouseLeave={() => setExchangeHovered(false)}
          disabled={!connected || shopLoading}
          style={{
            padding: '9px 28px',
            fontSize: 'clamp(0.72rem, 2.5vw, 0.82rem)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: connected ? (exchangeHovered ? '#ffffff' : '#ddaaff') : 'rgba(180,150,255,0.35)',
            background: shopLoading
              ? 'rgba(80, 40, 140, 0.4)'
              : exchangeHovered && connected
              ? 'linear-gradient(135deg, rgba(140, 80, 255, 0.7) 0%, rgba(80, 60, 200, 0.7) 100%)'
              : 'linear-gradient(135deg, rgba(100, 40, 180, 0.35) 0%, rgba(60, 40, 140, 0.35) 100%)',
            border: `1px solid ${connected ? (exchangeHovered ? 'rgba(200, 150, 255, 0.8)' : 'rgba(160, 100, 255, 0.45)') : 'rgba(140,100,255,0.2)'}`,
            borderRadius: 4,
            cursor: connected && !shopLoading ? 'pointer' : 'default',
            transition: 'all 0.25s ease',
            fontFamily: 'Georgia, serif',
            boxShadow:
              connected && exchangeHovered
                ? '0 0 22px rgba(160, 80, 255, 0.5)'
                : connected
                ? '0 0 10px rgba(120, 60, 255, 0.2)'
                : 'none',
            transform: connected && exchangeHovered ? 'scale(1.04)' : 'scale(1)',
            opacity: connected ? 1 : 0.5,
            whiteSpace: 'nowrap',
            minHeight: 44,
          }}
        >
          {shopLoading ? '...' : '⇄ EXCHANGE CRYSTALS'}
        </button>
      </div>

      {/* Version text */}
      <p
        style={{
          position: 'absolute',
          bottom: 'max(12px, env(safe-area-inset-bottom))',
          color: 'rgba(100, 120, 160, 0.5)',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          zIndex: 2,
          margin: 0,
        }}
      >
        v0.1.0
      </p>

      {/* CSS animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
