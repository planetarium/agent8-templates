import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameServer, useAsset } from '@agent8/gameserver';

interface TitleSceneProps {
  onStart: () => void;
}

const TitleScene: React.FC<TitleSceneProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();
  const { getAsset } = useAsset();
  const relicCount = getAsset('relic') ?? 0;

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

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate background sand/dust particles
  const sandParticles = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 4 + 3,
      drift: (Math.random() - 0.5) * 80,
      opacity: Math.random() * 0.4 + 0.15,
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
        background: 'linear-gradient(180deg, #1a0e05 0%, #2d1a0a 25%, #5c3310 55%, #d4882a 85%, #f0c060 100%)',
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
      {/* Background sand/dust particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sandParticles.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              backgroundColor: '#e8c880',
              borderRadius: '50%',
              left: `${s.x}%`,
              top: `${s.y}%`,
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 2}px ${s.size * 0.5}px rgba(232,200,128,0.3)`,
              animation: `driftSand ${s.duration}s infinite linear`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Warm light overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center 40%, rgba(232,180,80,0.15) 20%, transparent 70%)',
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
          background: 'rgba(26, 14, 5, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(232, 180, 80, 0.3)',
          borderRadius: '20px',
          padding: '40px 30px',
          boxShadow: '0 10px 40px rgba(60, 30, 10, 0.4), inset 0 0 30px rgba(232, 180, 80, 0.08)',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {/* Pyramid/Sun Icon */}
        <div style={{ marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun */}
            <circle cx="12" cy="8" r="3.5" fill="url(#titleSunG)" opacity="0.9" />
            <path d="M12 2V3.5M12 12.5V14M5.5 8H4M20 8H18.5M6.34 3.34L7.4 4.4M16.6 11.6L17.66 12.66M6.34 12.66L7.4 11.6M16.6 4.4L17.66 3.34" stroke="#e8c880" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            {/* Pyramid */}
            <path d="M4 22L12 12L20 22H4Z" fill="url(#titlePyrG)" opacity="0.85" />
            <path d="M12 12L12 22" stroke="rgba(232,200,128,0.3)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="titleSunG" x1="8" y1="5" x2="16" y2="11" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffe8a0" />
                <stop offset="1" stopColor="#cc8830" />
              </linearGradient>
              <linearGradient id="titlePyrG" x1="4" y1="22" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5e1a" />
                <stop offset="0.5" stopColor="#cc9040" />
                <stop offset="1" stopColor="#e8c060" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 900,
            color: '#e8c880',
            margin: '0 0 8px 0',
            textShadow: '0 0 20px rgba(232,180,80,0.6), 0 0 40px rgba(200,140,50,0.3)',
            fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
            letterSpacing: '4px',
          }}
        >
          DESERT
        </h1>
        <h2
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            fontWeight: 300,
            color: '#c8a050',
            margin: '0 0 24px 0',
            letterSpacing: '10px',
            textShadow: '0 0 10px rgba(200,140,50,0.4)',
          }}
        >
          RUINS
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 16px',
              background: 'rgba(200, 140, 50, 0.1)',
              border: '1px solid rgba(232, 180, 80, 0.3)',
              borderRadius: '20px',
              color: '#e8c880',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1.1em' }}>&#x2666;</span> {relicCount} Relics
          </div>
        )}

        <button
          onClick={handleStart}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            padding: '16px 40px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#fff',
            background: buttonHovered
              ? 'linear-gradient(135deg, #cc8830, #a06020)'
              : 'linear-gradient(135deg, #a06020, #7a4515)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: buttonHovered
              ? '0 0 30px rgba(232,180,80,0.5), inset 0 0 10px rgba(255,220,150,0.2)'
              : '0 4px 15px rgba(0,0,0,0.4)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 16,
            width: '100%',
            letterSpacing: '2px',
          }}
        >
          EXPLORE THE RUINS
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#e8c880',
            background: 'transparent',
            border: '2px solid rgba(232, 180, 80, 0.4)',
            borderRadius: '20px',
            cursor: connected && !shopLoading ? 'pointer' : 'not-allowed',
            opacity: connected ? 1 : 0.5,
            width: '100%',
            transition: 'all 0.2s',
            letterSpacing: '1px',
          }}
        >
          {shopLoading ? 'LOADING...' : 'EXCHANGE TOKENS'}
        </button>
      </div>

      <style>{`
        @keyframes driftSand {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-60vh) translateX(50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
