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
  const coreCount = getAsset('star_shard') ?? 0;

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

  const fireflies = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 3,
      color: ['#c4a265', '#6b8f4e', '#e8d5a3', '#8fba6f', '#d4aa42'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.5 + 0.2,
    }))
  ).current;

  const leaves = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 6,
      size: Math.random() * 12 + 8,
      rotation: Math.random() * 360,
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
        background: 'linear-gradient(180deg, #0d1f0d 0%, #1a3018 30%, #132813 60%, #0a1a0a 100%)',
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
      {/* Light from above */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '60%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(196,162,101,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Fireflies */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {fireflies.map((f) => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              width: f.size,
              height: f.size,
              borderRadius: '50%',
              background: f.color,
              left: `${f.x}%`,
              top: `${f.y}%`,
              opacity: f.opacity,
              boxShadow: `0 0 ${f.size * 2}px ${f.color}`,
              animation: `fireflyFloat ${f.duration}s ease-in-out infinite alternate`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Falling leaves */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {leaves.map((l) => (
          <div
            key={l.id}
            style={{
              position: 'absolute',
              width: l.size,
              height: l.size * 0.6,
              left: `${l.x}%`,
              top: '-20px',
              background: 'rgba(107, 143, 78, 0.3)',
              borderRadius: '50% 0 50% 0',
              transform: `rotate(${l.rotation}deg)`,
              animation: `leafFall ${l.duration}s linear infinite`,
              animationDelay: `${l.delay}s`,
              opacity: 0.4,
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
          background: 'rgba(13, 26, 13, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(196, 162, 101, 0.2)',
          borderRadius: '12px',
          padding: '40px 30px',
          boxShadow: '0 0 60px rgba(107, 143, 78, 0.1), 0 0 120px rgba(196, 162, 101, 0.05), inset 0 0 30px rgba(107, 143, 78, 0.03)',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 10vw, 4.5rem)',
            fontWeight: 900,
            color: '#c4a265',
            margin: '0 0 4px 0',
            textShadow: '0 0 20px rgba(196,162,101,0.5), 0 0 40px rgba(196,162,101,0.2), 0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '4px',
            lineHeight: 1.1,
          }}
        >
          SPIRIT GROVE
        </h1>
        <div
          style={{
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #6b8f4e, #c4a265, #6b8f4e, transparent)',
            margin: '8px auto 20px',
          }}
        />
        <h2
          style={{
            fontSize: 'clamp(0.7rem, 3vw, 1rem)',
            fontWeight: 400,
            color: '#6b8f4e',
            margin: '0 0 24px 0',
            letterSpacing: '8px',
            fontFamily: "'Cinzel', serif",
            textShadow: '0 0 10px rgba(107,143,78,0.5)',
          }}
        >
          ANCIENT AWAKENING
        </h2>

        {connected && (
          <div
            style={{
              marginBottom: 24,
              padding: '8px 20px',
              background: 'rgba(107, 143, 78, 0.08)',
              border: '1px solid rgba(107, 143, 78, 0.25)',
              borderRadius: '8px',
              color: '#c4a265',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Philosopher', serif",
              fontSize: '14px',
            }}
          >
            <span style={{ fontSize: '18px' }}>&#10048;</span>
            {coreCount} Spirit Runes
          </div>
        )}

        <button
          onClick={handleStart}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          style={{
            padding: '16px 40px',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: buttonHovered ? '#0d1f0d' : '#c4a265',
            background: buttonHovered ? 'linear-gradient(90deg, #6b8f4e, #c4a265)' : 'transparent',
            border: '2px solid rgba(196, 162, 101, 0.4)',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: buttonHovered ? '0 0 30px rgba(107,143,78,0.4), inset 0 0 20px rgba(196,162,101,0.2)' : '0 0 15px rgba(196,162,101,0.1)',
            transform: buttonHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.3s ease',
            marginBottom: 16,
            width: '100%',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          Enter the Grove
        </button>

        <button
          onClick={openCrossRampShop}
          disabled={!connected || shopLoading}
          style={{
            padding: '12px 24px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#6b8f4e',
            background: 'transparent',
            border: '1px solid rgba(107, 143, 78, 0.3)',
            borderRadius: '8px',
            cursor: connected && !shopLoading ? 'pointer' : 'not-allowed',
            opacity: connected ? 1 : 0.5,
            width: '100%',
            transition: 'all 0.3s ease',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '2px',
          }}
        >
          {shopLoading ? 'Communing...' : 'Spirit Exchange'}
        </button>
      </div>

      <style>{`
        @keyframes fireflyFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { transform: translate(15px, -20px) scale(1.3); opacity: 0.3; }
        }
        @keyframes leafFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TitleScene;
