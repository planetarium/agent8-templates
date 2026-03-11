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
  const fragmentCount = getAsset('data_fragment') ?? 0;

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

  const glitchLines = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      width: Math.random() * 60 + 20,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? '#ff00ff' : '#00ffff',
    }))
  ).current;

  const gridDots = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
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
        background: 'linear-gradient(160deg, #0a0014 0%, #1a0030 35%, #0d001a 65%, #150028 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        fontFamily: "'Orbitron', system-ui, sans-serif",
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        boxSizing: 'border-box',
      }}
    >
      {/* Background grid dots */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {gridDots.map((d) => (
          <div
            key={d.id}
            style={{
              position: 'absolute',
              width: d.size,
              height: d.size,
              backgroundColor: '#ff00ff',
              borderRadius: '50%',
              left: `${d.x}%`,
              top: `${d.y}%`,
              opacity: 0.15,
              animation: `cyberPulse 3s infinite alternate`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Glitch scan lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {glitchLines.map((l) => (
          <div
            key={l.id}
            style={{
              position: 'absolute',
              width: `${l.width}%`,
              height: '1px',
              backgroundColor: l.color,
              left: `${l.x}%`,
              top: `${l.y}%`,
              opacity: 0,
              animation: `glitchFlash ${l.duration}s ${l.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Scan line overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(10, 0, 20, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 0, 255, 0.3)',
          borderRadius: '0',
          padding: '40px 30px',
          boxShadow: '0 0 40px rgba(255, 0, 255, 0.15), inset 0 0 30px rgba(0, 255, 255, 0.05), 0 0 1px rgba(255,0,255,0.8)',
          textAlign: 'center',
          maxWidth: '90%',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        }}
      >
        {/* Hex icon */}
        <div style={{ marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="url(#hexGrad)" strokeWidth="2" />
            <polygon points="32,14 48,22 48,38 32,46 16,38 16,22" fill="rgba(255,0,255,0.15)" stroke="#00ffff" strokeWidth="1" />
            <circle cx="32" cy="30" r="6" fill="#ff00ff" opacity="0.8" />
            <line x1="32" y1="24" x2="32" y2="36" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
            <line x1="26" y1="30" x2="38" y2="30" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
            <defs>
              <linearGradient id="hexGrad" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff00ff" />
                <stop offset="1" stopColor="#00ffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 900,
            color: '#fff',
            margin: '0 0 4px 0',
            textShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff80, 0 0 60px #ff00ff40',
            letterSpacing: '4px',
          }}
        >
          NEON DRIFT
        </h1>
        <h2
          style={{
            fontSize: 'clamp(0.8rem, 3vw, 1.2rem)',
            fontWeight: 400,
            color: '#00ffff',
            margin: '0 0 24px 0',
            letterSpacing: '10px',
            textShadow: '0 0 10px #00ffff80',
          }}
        >
          CYBER ARENA
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 16px',
              background: 'rgba(255, 0, 255, 0.08)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#00ffff',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            <span style={{ color: '#ff00ff' }}>///</span> {fragmentCount} DATA FRAGMENTS
          </div>
        )}

        <button
          onClick={handleStart}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            padding: '16px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            fontFamily: "'Orbitron', system-ui, sans-serif",
            color: '#fff',
            background: buttonHovered
              ? 'linear-gradient(135deg, #ff00ff, #cc00cc)'
              : 'linear-gradient(135deg, #cc00cc, #8800aa)',
            border: '1px solid #ff00ff',
            borderRadius: '0',
            cursor: 'pointer',
            boxShadow: buttonHovered
              ? '0 0 30px rgba(255, 0, 255, 0.6), inset 0 0 20px rgba(255,0,255,0.2)'
              : '0 0 15px rgba(255, 0, 255, 0.3)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 16,
            width: '100%',
            letterSpacing: '3px',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          JACK IN
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            fontFamily: "'Orbitron', system-ui, sans-serif",
            color: '#00ffff',
            background: 'transparent',
            border: '1px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '0',
            cursor: connected && !shopLoading ? 'pointer' : 'not-allowed',
            opacity: connected ? 1 : 0.4,
            width: '100%',
            transition: 'all 0.2s',
            letterSpacing: '2px',
          }}
        >
          {shopLoading ? 'SYNCING...' : 'TOKEN EXCHANGE'}
        </button>
      </div>

      <style>{`
        @keyframes cyberPulse {
          0% { opacity: 0.05; transform: scale(1); }
          100% { opacity: 0.25; transform: scale(1.5); }
        }
        @keyframes glitchFlash {
          0%, 95%, 100% { opacity: 0; }
          96%, 99% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
