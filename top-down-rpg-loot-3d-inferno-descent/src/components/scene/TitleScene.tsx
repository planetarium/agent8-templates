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

  const { connected, server } = useGameServer();
  const { getAsset } = useAsset();
  const soulCount = getAsset('fire_soul') ?? 0;

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

  // Generate background ember particles
  const embers = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3,
      drift: (Math.random() - 0.5) * 30,
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
        background: 'linear-gradient(180deg, #1a0a00 0%, #2d0a00 30%, #4a1500 60%, #ff4500 100%)',
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
      {/* Background Embers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {embers.map((e) => (
          <div
            key={e.id}
            style={{
              position: 'absolute',
              width: e.size,
              height: e.size,
              backgroundColor: e.size > 3 ? '#ff6600' : '#ff4400',
              borderRadius: '50%',
              left: `${e.x}%`,
              top: `${e.y}%`,
              boxShadow: `0 0 ${e.size * 3}px ${e.size}px rgba(255, 100, 0, 0.6)`,
              animation: `riseEmber ${e.duration}s infinite linear`,
              animationDelay: `${e.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Dark vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
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
          background: 'rgba(20, 5, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255, 100, 0, 0.4)',
          borderRadius: '20px',
          padding: '40px 30px',
          boxShadow: '0 10px 40px rgba(255, 60, 0, 0.3), inset 0 0 30px rgba(255, 80, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {/* Fire Soul Icon */}
        <div style={{ marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 7 7 7 12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12C17 10.5 16.3 9 15.5 7.8C15.5 7.8 15 9 14 9C14 9 16 4 12 2Z" fill="url(#fireGrad)" />
            <path d="M12 22C8.7 22 6 19.3 6 16C6 12 12 4 12 4C12 4 18 12 18 16C18 19.3 15.3 22 12 22Z" fill="url(#fireGrad2)" opacity="0.6" />
            <defs>
              <linearGradient id="fireGrad" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffdd00" />
                <stop offset="0.5" stopColor="#ff6600" />
                <stop offset="1" stopColor="#cc2200" />
              </linearGradient>
              <linearGradient id="fireGrad2" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff8800" />
                <stop offset="1" stopColor="#880000" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 900,
            color: '#ff8844',
            margin: '0 0 8px 0',
            textShadow: '0 0 20px rgba(255, 100, 0, 0.8), 0 0 40px rgba(255, 60, 0, 0.4)',
            fontFamily: '"Georgia", serif',
            letterSpacing: '4px',
          }}
        >
          INFERNO
        </h1>
        <h2
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            fontWeight: 300,
            color: '#ff6633',
            margin: '0 0 24px 0',
            letterSpacing: '10px',
            textShadow: '0 0 10px rgba(255, 60, 0, 0.5)',
          }}
        >
          DESCENT
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 16px',
              background: 'rgba(255, 80, 0, 0.12)',
              border: '1px solid rgba(255, 100, 0, 0.35)',
              borderRadius: '20px',
              color: '#ffaa66',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ filter: 'hue-rotate(-10deg)' }}>&#x1F525;</span> {soulCount} Fire Souls
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
              ? 'linear-gradient(135deg, #ff6600, #cc3300)'
              : 'linear-gradient(135deg, #ff4400, #aa2200)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: buttonHovered
              ? '0 0 30px rgba(255, 80, 0, 0.8), inset 0 0 10px rgba(255, 200, 100, 0.3)'
              : '0 4px 15px rgba(0,0,0,0.5)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 16,
            width: '100%',
            letterSpacing: '2px',
          }}
        >
          ENTER THE ABYSS
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#ffaa66',
            background: 'transparent',
            border: '2px solid rgba(255, 100, 0, 0.5)',
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
        @keyframes riseEmber {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
