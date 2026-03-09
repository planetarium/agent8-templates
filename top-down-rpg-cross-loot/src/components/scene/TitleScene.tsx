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
  const orbCount = getAsset('orb') ?? 0;

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

  // Generate floating particles (fireflies)
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: 2 + (i % 4),
      x: (i * 23 + 11) % 100,
      duration: 8 + (i * 7 % 10),
      delay: (i * 13) % 8,
      opacity: 0.3 + (i * 5 % 5) * 0.1,
      hue: 100 + (i * 17 % 40), // Greens and yellow-greens
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
        background: 'linear-gradient(180deg, #05120a 0%, #0a2414 40%, #11361f 80%, #0b1c11 100%)',
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
      {/* Dark Forest overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 100%, rgba(20, 60, 30, 0.4) 0%, transparent 80%)' }} />

      {/* Floating firefly particles */}
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
              boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue}, 100%, 70%)`,
              animation: `floatUp ${p.duration}s ease-in-out infinite`,
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
          background: 'radial-gradient(circle, rgba(255, 100, 255, 0.15) 0%, transparent 60%)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main content card ── */}
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
        {/* Magic Orb SVG Icon */}
        <div style={{ marginBottom: 16, animation: 'orbPulse 4s ease-in-out infinite', flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="38" fill="url(#orbGrad)" stroke="rgba(255,180,255,0.8)" strokeWidth="2" />
            <circle cx="50" cy="50" r="34" fill="url(#innerGrad)" />
            <path d="M 35 30 Q 50 15 65 30" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" filter="blur(2px)" />
            <defs>
              <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffb3ff" stopOpacity="1" />
                <stop offset="70%" stopColor="#d24dff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8600b3" stopOpacity="0.9" />
              </radialGradient>
              <radialGradient id="innerGrad" cx="35%" cy="35%" r="40%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 10, position: 'relative' }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 12vw, 4rem)',
              fontWeight: 800,
              letterSpacing: '0.02em',
              background: 'linear-gradient(180deg, #d4f0d4 0%, #7acc7a 40%, #298a29 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1,
              fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif',
              filter: 'drop-shadow(0 4px 10px rgba(40, 150, 40, 0.6))',
            }}
          >
            MYSTIC
          </h1>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#ffd1ff',
              textShadow: '0 0 15px rgba(255, 100, 255, 0.8)',
              margin: '4px 0 0 0',
              fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif',
            }}
          >
            FOREST
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            color: '#a3d9a3',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)',
            letterSpacing: '0.25em',
            marginTop: 0,
            marginBottom: 24,
            fontFamily: '"Trebuchet MS", sans-serif',
            textAlign: 'center',
            textShadow: '0 0 5px rgba(100,255,100,0.3)',
          }}
        >
          GATHER · CRAFT · REDEEM
        </p>

        {/* Orb count badge */}
        {connected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: 20,
              background: 'rgba(20, 40, 20, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(150, 255, 150, 0.4)',
              borderRadius: '30px',
              padding: '6px 16px',
              boxShadow: '0 0 15px rgba(100, 255, 100, 0.2)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'radial-gradient(circle, #ffb3ff 0%, #d24dff 100%)', boxShadow: '0 0 8px #ffb3ff' }} />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#e6ffe6',
                textShadow: '0 0 8px rgba(100,255,100,0.6)',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            >
              {orbCount}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#a3d9a3',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Orbs
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
            padding: '14px 40px',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: '#ffffff',
            background: buttonHovered
              ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
              : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: `2px solid ${buttonHovered ? '#86efac' : '#4ade80'}`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: '"Trebuchet MS", sans-serif',
            boxShadow: buttonHovered
              ? '0 8px 25px rgba(74, 222, 128, 0.6), inset 0 0 10px rgba(255,255,255,0.3)'
              : '0 4px 15px rgba(34, 197, 94, 0.4)',
            transform: buttonHovered ? 'translateY(-2px)' : 'translateY(0)',
            marginBottom: 16,
            minWidth: 220,
            minHeight: 52,
          }}
        >
          ENTER THE FOREST
        </button>

        {/* Exchange Button */}
        <button
          onClick={openCrossRampShop}
          onMouseEnter={() => setExchangeHovered(true)}
          onMouseLeave={() => setExchangeHovered(false)}
          disabled={!connected || shopLoading}
          style={{
            padding: '10px 30px',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: connected ? (exchangeHovered ? '#ffffff' : '#ffd1ff') : 'rgba(200,150,200,0.4)',
            background: shopLoading
              ? 'rgba(60, 20, 60, 0.5)'
              : exchangeHovered && connected
              ? 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)'
              : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
            border: `1px solid ${connected ? (exchangeHovered ? '#f0abfc' : '#d946ef') : 'rgba(150,100,150,0.3)'}`,
            borderRadius: '8px',
            cursor: connected && !shopLoading ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            fontFamily: '"Trebuchet MS", sans-serif',
            boxShadow:
              connected && exchangeHovered
                ? '0 6px 20px rgba(217, 70, 239, 0.5)'
                : connected
                ? '0 2px 10px rgba(168, 85, 247, 0.3)'
                : 'none',
            transform: connected && exchangeHovered ? 'translateY(-1px)' : 'translateY(0)',
            opacity: connected ? 1 : 0.6,
            minHeight: 44,
          }}
        >
          {shopLoading ? '...' : '⇄ EXCHANGE ORBS'}
        </button>
      </div>

      {/* Version text */}
      <p
        style={{
          position: 'absolute',
          bottom: 'max(12px, env(safe-area-inset-bottom))',
          color: 'rgba(150, 200, 150, 0.4)',
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
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-50vh) scale(1.2) translateX(20px); }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(0.5) translateX(-20px); opacity: 0; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 15px rgba(210, 77, 255, 0.6)); }
          50% { transform: translateY(-8px) scale(1.05); filter: drop-shadow(0 0 25px rgba(255, 179, 255, 0.9)); }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;