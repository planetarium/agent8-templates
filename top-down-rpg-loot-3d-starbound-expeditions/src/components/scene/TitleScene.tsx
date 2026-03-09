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
  const shardCount = getAsset('star_shard') ?? 0;

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

  // Generate background elements
  const stars = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1a365d 40%, #06b6d4 100%)',
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
      {/* Background Stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              backgroundColor: '#fff',
              borderRadius: '50%',
              left: `${s.x}%`,
              top: `${s.y}%`,
              boxShadow: '0 0 8px 2px rgba(255,255,255,0.8)',
              animation: `pulseStar ${s.duration}s infinite alternate`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '24px',
          padding: '40px 30px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.2)',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {/* Star Icon */}
        <div style={{ marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#starGrad)" stroke="#06b6d4" strokeWidth="1"/>
            <defs>
              <linearGradient id="starGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#67e8f9" />
                <stop offset="1" stopColor="#0891b2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 800,
            color: '#cffafe',
            margin: '0 0 8px 0',
            textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
            fontFamily: '"Trebuchet MS", serif',
            letterSpacing: '2px',
          }}
        >
          STARBOUND
        </h1>
        <h2
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            fontWeight: 300,
            color: '#67e8f9',
            margin: '0 0 24px 0',
            letterSpacing: '8px',
          }}
        >
          EXPEDITIONS
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 16px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '20px',
              color: '#cffafe',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✨</span> {shardCount} Star Shards
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
            background: buttonHovered ? '#0891b2' : '#06b6d4',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: buttonHovered ? '0 0 25px rgba(6, 182, 212, 0.8)' : '0 4px 15px rgba(0,0,0,0.3)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 16,
            width: '100%',
          }}
        >
          START JOURNEY
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#cffafe',
            background: 'transparent',
            border: '2px solid #06b6d4',
            borderRadius: '20px',
            cursor: connected && !shopLoading ? 'pointer' : 'not-allowed',
            opacity: connected ? 1 : 0.5,
            width: '100%',
            transition: 'all 0.2s',
          }}
        >
          {shopLoading ? 'LOADING...' : 'EXCHANGE TOKENS'}
        </button>
      </div>

      <style>{`
        @keyframes pulseStar {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
