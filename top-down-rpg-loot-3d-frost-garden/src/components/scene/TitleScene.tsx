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
  const flowerCount = getAsset('starflower') ?? 0;

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

  // Generate background snowflake particles
  const snowflakes = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      size: Math.random() * 5 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 5 + 4,
      drift: (Math.random() - 0.5) * 40,
      opacity: Math.random() * 0.5 + 0.3,
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
        background: 'linear-gradient(180deg, #0a1628 0%, #122240 30%, #1a3355 60%, #6db3f2 100%)',
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
      {/* Background Snowflakes */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {snowflakes.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              left: `${s.x}%`,
              top: `${s.y}%`,
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 2}px ${s.size * 0.5}px rgba(180, 220, 255, 0.4)`,
              animation: `fallSnow ${s.duration}s infinite linear`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Soft light overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(100,180,255,0.1) 30%, transparent 70%)',
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
          background: 'rgba(10, 20, 45, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(130, 200, 255, 0.3)',
          borderRadius: '20px',
          padding: '40px 30px',
          boxShadow: '0 10px 40px rgba(50, 130, 220, 0.2), inset 0 0 30px rgba(100, 180, 255, 0.08)',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {/* Snowflake Icon */}
        <div style={{ marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V22M12 2L9 5M12 2L15 5M12 22L9 19M12 22L15 19" stroke="url(#snowGrad)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.93 4.93L19.07 19.07M4.93 4.93L5.5 8.5M4.93 4.93L8.5 5.5M19.07 19.07L18.5 15.5M19.07 19.07L15.5 18.5" stroke="url(#snowGrad)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.93 19.07L19.07 4.93M4.93 19.07L8.5 18.5M4.93 19.07L5.5 15.5M19.07 4.93L15.5 5.5M19.07 4.93L18.5 8.5" stroke="url(#snowGrad)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="url(#snowGrad2)" opacity="0.6" />
            <defs>
              <linearGradient id="snowGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a0d8ff" />
                <stop offset="0.5" stopColor="#60b0e8" />
                <stop offset="1" stopColor="#88ccff" />
              </linearGradient>
              <linearGradient id="snowGrad2" x1="9" y1="9" x2="15" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c8e8ff" />
                <stop offset="1" stopColor="#4488cc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 900,
            color: '#88ccff',
            margin: '0 0 8px 0',
            textShadow: '0 0 20px rgba(100, 180, 255, 0.6), 0 0 40px rgba(60, 140, 220, 0.3)',
            fontFamily: '"Georgia", serif',
            letterSpacing: '4px',
          }}
        >
          FROST
        </h1>
        <h2
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            fontWeight: 300,
            color: '#6db3f2',
            margin: '0 0 24px 0',
            letterSpacing: '10px',
            textShadow: '0 0 10px rgba(80, 160, 240, 0.4)',
          }}
        >
          GARDEN
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 16px',
              background: 'rgba(80, 160, 240, 0.1)',
              border: '1px solid rgba(130, 200, 255, 0.3)',
              borderRadius: '20px',
              color: '#88ccff',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>&#x2744;</span> {flowerCount} Starflowers
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
              ? 'linear-gradient(135deg, #4a9edf, #2872b5)'
              : 'linear-gradient(135deg, #3688cc, #1e5a99)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: buttonHovered
              ? '0 0 30px rgba(80, 160, 240, 0.6), inset 0 0 10px rgba(180, 220, 255, 0.2)'
              : '0 4px 15px rgba(0,0,0,0.4)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 16,
            width: '100%',
            letterSpacing: '2px',
          }}
        >
          ENTER THE GARDEN
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#88ccff',
            background: 'transparent',
            border: '2px solid rgba(130, 200, 255, 0.4)',
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
        @keyframes fallSnow {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
