import React, { useEffect, useState } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useGameStore } from '../../stores/gameStore';

/**
 * TitleScreen — shown before the game starts.
 * Displays game title, player's gem balance, and start button.
 * [CHANGE] Fully redesign for your concept: title, logo, tagline, colors.
 */
const TitleScreen: React.FC = () => {
  const { server } = useGameServer();
  const { startGame, setGamePhase } = useGameStore();
  const [gemBalance, setGemBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!server) return;
    server.remoteFunction('getGemBalance', [])
      .then((result: any) => {
        setGemBalance(result?.balance ?? 0);
      })
      .catch(() => setGemBalance(0))
      .finally(() => setIsLoading(false));
  }, [server]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 70%, #0d0a1a 100%)' }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#b07aff',
            letterSpacing: '0.15em',
            textShadow: '0 0 30px rgba(176,122,255,0.6), 0 0 60px rgba(119,68,204,0.4)',
            margin: 0,
          }}
        >
          ◆ CRYSTAL DUNGEON
        </h1>
        <p style={{ color: '#7755aa', marginTop: '0.5rem', fontSize: '1rem', letterSpacing: '0.2em' }}>
          3D DUNGEON CRAWLER
        </p>
      </div>

      {/* Gem balance */}
      <div
        style={{
          background: 'rgba(176,122,255,0.1)',
          border: '1px solid rgba(176,122,255,0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#9966dd', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>YOUR GEM BALANCE</p>
        <p style={{ color: '#b07aff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
          ◆ {isLoading ? '...' : gemBalance.toLocaleString()} GEMS
        </p>
        <p style={{ color: '#7755aa', fontSize: '0.7rem', margin: '0.25rem 0 0' }}>100 GEMS = 1 GDT TOKEN</p>
      </div>

      {/* Start button */}
      <button
        onClick={startGame}
        style={{
          background: 'linear-gradient(135deg, #7744cc, #b07aff)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          letterSpacing: '0.1em',
          boxShadow: '0 0 20px rgba(176,122,255,0.4)',
          marginBottom: '1rem',
        }}
      >
        ENTER DUNGEON
      </button>

      {/* Wallet shortcut */}
      <button
        onClick={() => setGamePhase('wallet')}
        style={{
          background: 'transparent',
          color: '#7755aa',
          border: '1px solid rgba(119,85,170,0.4)',
          borderRadius: '6px',
          padding: '0.5rem 1.5rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        ◆ Exchange Gems
      </button>
    </div>
  );
};

export default TitleScreen;
