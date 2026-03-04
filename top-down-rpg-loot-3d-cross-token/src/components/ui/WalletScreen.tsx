import React, { useEffect, useState } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useGameStore } from '../../stores/gameStore';

/**
 * WalletScreen — shows gem balance and CROSS token exchange info.
 * [CHANGE] Update token name (GDT), exchange rate, and styling to match your concept.
 */
const WalletScreen: React.FC = () => {
  const { server } = useGameServer();
  const { setGamePhase } = useGameStore();
  const [gemBalance, setGemBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!server) return;
    server.remoteFunction('getGemBalance', [])
      .then((r: any) => setGemBalance(r?.balance ?? 0))
      .catch(() => setGemBalance(0))
      .finally(() => setIsLoading(false));
  }, [server]);

  const handleOpenCrossRamp = async () => {
    try {
      const url = await server?.getCrossRampShopUrl?.();
      if (url) {
        setGamePhase('crossramp');
      }
    } catch {
      console.error('Failed to open CROSS Mini Hub');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(13,10,26,0.96)', backdropFilter: 'blur(8px)' }}
    >
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#b07aff',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}
      >
        ◆ GEM EXCHANGE
      </h1>
      <p style={{ color: '#7755aa', marginBottom: '2rem', fontSize: '0.85rem' }}>Convert your gems into GDT tokens</p>

      {/* Balance */}
      <div
        style={{
          background: 'rgba(26,15,46,0.9)',
          border: '1px solid rgba(176,122,255,0.4)',
          borderRadius: '12px',
          padding: '1.5rem 2.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#7755aa', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>YOUR GEM BALANCE</p>
        <p style={{ color: '#b07aff', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
          ◆ {isLoading ? '...' : gemBalance.toLocaleString()}
        </p>
        <p style={{ color: '#7755aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>GEMS</p>
      </div>

      {/* Exchange rate */}
      <div
        style={{
          background: 'rgba(119,68,204,0.15)',
          border: '1px solid rgba(176,122,255,0.25)',
          borderRadius: '8px',
          padding: '1rem 2rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#b07aff', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
          100 GEMS = 1 GDT TOKEN
        </p>
        <p style={{ color: '#7755aa', fontSize: '0.75rem', marginTop: '0.4rem' }}>
          Gem Dungeon Token — powered by CROSS blockchain
        </p>
      </div>

      {/* CROSS Mini Hub */}
      <button
        onClick={handleOpenCrossRamp}
        style={{
          background: 'linear-gradient(135deg, #7744cc, #b07aff)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '0.9rem 2rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '0.75rem',
          width: '260px',
          boxShadow: '0 0 20px rgba(176,122,255,0.3)',
        }}
      >
        ◆ Open CROSS Mini Hub
      </button>

      <button
        onClick={() => setGamePhase('title')}
        style={{
          background: 'transparent',
          color: '#7755aa',
          border: '1px solid rgba(119,85,170,0.4)',
          borderRadius: '6px',
          padding: '0.5rem 1.5rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
          width: '260px',
        }}
      >
        ← Back to Title
      </button>
    </div>
  );
};

export default WalletScreen;
