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
  const seedCount = getAsset('fairy_seed') ?? 0;

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

  // Generate floating fireflies
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: 2 + (i % 4),
      x: (i * 29 + 11) % 100,
      y: (i * 17 + 7) % 100,
      duration: 3 + (i * 11 % 5),
      delay: (i * 13) % 4,
      opacity: 0.3 + (i % 5) * 0.15,
      hue: i % 2 === 0 ? 140 : 320, // mix of green/cyan and pink
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
        background: 'linear-gradient(180deg, #091a11 0%, #0c2618 30%, #153823 60%, #0d1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        boxSizing: 'border-box',
      }}
    >
      {/* Fireflies */}
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
              top: `${p.y}%`,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue}, 100%, 70%)`,
              animation: `firefly ${p.duration}s ease-in-out infinite alternate`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Background glow orb */}
      <div
        style={{
          position: 'absolute',
          width: '90vw',
          height: '90vw',
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100, 255, 150, 0.1) 0%, transparent 60%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

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
        {/* Magic Mushroom Icon */}
        <div style={{ marginBottom: 12, animation: 'floatBob 4s ease-in-out infinite', flexShrink: 0 }}>
          <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 10 C18 10 10 24 10 32 C10 36 14 38 18 38 L46 38 C50 38 54 36 54 32 C54 24 46 10 32 10 Z" fill="url(#mushGrad)" stroke="rgba(255,150,220,0.8)" strokeWidth="2" />
            <path d="M26 38 L28 54 C28 56 36 56 36 54 L38 38 Z" fill="#88ccff" opacity="0.8" />
            <circle cx="22" cy="24" r="3" fill="#ffffff" opacity="0.6" />
            <circle cx="42" cy="26" r="2.5" fill="#ffffff" opacity="0.6" />
            <circle cx="32" cy="18" r="4" fill="#ffffff" opacity="0.6" />
            <defs>
              <linearGradient id="mushGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff88cc" />
                <stop offset="100%" stopColor="#8844ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 6, position: 'relative' }}>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 10vw, 4.5rem)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              background: 'linear-gradient(180deg, #d5ffeb 0%, #80e8af 50%, #208050 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1.1,
              fontFamily: '"Trebuchet MS", serif',
              filter: 'drop-shadow(0 0 15px rgba(100, 255, 150, 0.4))',
            }}
          >
            MYSTIC
          </h1>
          <h1
            style={{
              fontSize: 'clamp(1rem, 4vw, 1.8rem)',
              fontWeight: 600,
              letterSpacing: '0.4em',
              background: 'linear-gradient(180deg, #ffe8f4 0%, #ff80c0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '4px 0 0 0',
              fontFamily: '"Trebuchet MS", serif',
              filter: 'drop-shadow(0 0 10px rgba(255, 100, 180, 0.5))',
            }}
          >
            GLADE
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            color: 'rgba(180, 255, 200, 0.7)',
            fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
            letterSpacing: '0.25em',
            marginTop: 0,
            marginBottom: 20,
            fontFamily: 'sans-serif',
            textAlign: 'center',
          }}
        >
          FORAGE · EXPLORE · ENCHANT
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, rgba(120,255,160,0.6))' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(150,255,180,0.8)', boxShadow: '0 0 8px rgba(150,255,180,0.8)' }} />
          <div style={{ width: 40, height: 1, background: 'linear-gradient(to left, transparent, rgba(120,255,160,0.6))' }} />
        </div>

        {/* Seed count badge */}
        {connected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: 16,
              background: 'rgba(10, 30, 15, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(100, 255, 150, 0.3)',
              borderRadius: '40px',
              padding: '6px 16px 6px 10px',
              boxShadow: '0 0 16px rgba(80, 255, 120, 0.15)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ff88cc', boxShadow: '0 0 8px #ff44aa' }} />
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#e8fff4', textShadow: '0 0 8px rgba(100,255,150,0.5)', minWidth: '20px', textAlign: 'center', fontFamily: "sans-serif" }}>
              {seedCount}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(160, 255, 180, 0.7)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Fairy Seeds
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
            letterSpacing: '0.2em',
            color: buttonHovered ? '#ffffff' : '#b8ffd0',
            background: buttonHovered
              ? 'linear-gradient(135deg, rgba(60, 200, 100, 0.8) 0%, rgba(30, 150, 80, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(40, 140, 70, 0.5) 0%, rgba(20, 90, 40, 0.5) 100%)',
            border: `1px solid ${buttonHovered ? 'rgba(140, 255, 180, 0.9)' : 'rgba(100, 200, 140, 0.5)'}`,
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            fontFamily: 'sans-serif',
            boxShadow: buttonHovered ? '0 0 25px rgba(80, 255, 140, 0.5)' : '0 0 15px rgba(40, 150, 80, 0.3)',
            transform: buttonHovered ? 'scale(1.05)' : 'scale(1)',
            marginBottom: 12,
            minWidth: 200,
            minHeight: 48,
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
            padding: '9px 28px',
            fontSize: 'clamp(0.72rem, 2.5vw, 0.82rem)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: connected ? (exchangeHovered ? '#ffffff' : '#ffb8e0') : 'rgba(255,180,220,0.35)',
            background: shopLoading
              ? 'rgba(140, 40, 80, 0.4)'
              : exchangeHovered && connected
              ? 'linear-gradient(135deg, rgba(255, 80, 160, 0.7) 0%, rgba(200, 60, 120, 0.7) 100%)'
              : 'linear-gradient(135deg, rgba(180, 40, 100, 0.35) 0%, rgba(140, 40, 80, 0.35) 100%)',
            border: `1px solid ${connected ? (exchangeHovered ? 'rgba(255, 150, 200, 0.8)' : 'rgba(255, 100, 160, 0.45)') : 'rgba(255,100,160,0.2)'}`,
            borderRadius: 8,
            cursor: connected && !shopLoading ? 'pointer' : 'default',
            transition: 'all 0.25s ease',
            fontFamily: 'sans-serif',
            boxShadow: connected && exchangeHovered ? '0 0 20px rgba(255, 80, 160, 0.5)' : 'none',
            transform: connected && exchangeHovered ? 'scale(1.04)' : 'scale(1)',
            opacity: connected ? 1 : 0.5,
            whiteSpace: 'nowrap',
            minHeight: 44,
          }}
        >
          {shopLoading ? '...' : '⇄ EXCHANGE SEEDS'}
        </button>
      </div>

      <style>{`
        @keyframes firefly {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { transform: translate(20px, -20px) scale(1.5); opacity: 0.2; }
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
