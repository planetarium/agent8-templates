import React, { useEffect, useState } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useGameStore } from '../../stores/gameStore';

/**
 * GameOverScreen — shown when player dies.
 * Displays final stats and provides gem exchange / restart actions.
 * [CHANGE] Redesign to match your concept's theme and token name.
 */
const GameOverScreen: React.FC = () => {
  const { server } = useGameServer();
  const { score, floor, totalGems, gemsPending, restartGame, setGamePhase } = useGameStore();
  const [bestScore, setBestScore] = useState<number>(0);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!server) return;
    server.remoteFunction('saveHighScore', [score, floor]).catch(() => {});
    server.remoteFunction('getPlayerStats', [])
      .then((stats: any) => setBestScore(stats?.bestScore ?? 0))
      .catch(() => {});
  }, [server, score, floor]);

  const handleExchangeGems = async () => {
    if (!server || gemsPending <= 0 || claimStatus !== 'idle') return;
    setClaimStatus('claiming');
    try {
      await server.remoteFunction('claimGems', [gemsPending]);
      setClaimStatus('done');
    } catch {
      setClaimStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(13,10,26,0.95)', backdropFilter: 'blur(8px)' }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: '#ff4466',
          textShadow: '0 0 20px rgba(255,68,102,0.5)',
          marginBottom: '0.5rem',
        }}
      >
        YOU DIED
      </h1>
      <p style={{ color: '#7755aa', marginBottom: '2rem', fontSize: '0.9rem' }}>Better luck next time, adventurer</p>

      {/* Stats */}
      <div
        style={{
          background: 'rgba(26,15,46,0.9)',
          border: '1px solid rgba(176,122,255,0.3)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          minWidth: '280px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
          <div>
            <p style={{ color: '#7755aa', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>SCORE</p>
            <p style={{ color: '#b07aff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{score.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: '#7755aa', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>FLOOR</p>
            <p style={{ color: '#b07aff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{floor}</p>
          </div>
          <div>
            <p style={{ color: '#7755aa', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>GEMS</p>
            <p style={{ color: '#44aaff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>◆ {totalGems}</p>
          </div>
          <div>
            <p style={{ color: '#7755aa', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>BEST</p>
            <p style={{ color: '#ffaa44', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{bestScore.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Exchange gems */}
      <button
        onClick={handleExchangeGems}
        disabled={gemsPending <= 0 || claimStatus !== 'idle'}
        style={{
          background: claimStatus === 'done' ? '#2a5a2a' : 'linear-gradient(135deg, #7744cc, #b07aff)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '0.8rem 2rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: gemsPending <= 0 || claimStatus !== 'idle' ? 'not-allowed' : 'pointer',
          opacity: gemsPending <= 0 ? 0.5 : 1,
          marginBottom: '0.75rem',
          width: '240px',
        }}
      >
        {claimStatus === 'claiming' && '⏳ Claiming...'}
        {claimStatus === 'done' && '✓ Gems Claimed!'}
        {claimStatus === 'error' && '✗ Failed — Retry'}
        {claimStatus === 'idle' && `◆ EXCHANGE ${gemsPending} GEMS`}
      </button>

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
          marginBottom: '0.75rem',
          width: '240px',
        }}
      >
        ◆ Open Wallet / CROSS
      </button>

      <button
        onClick={restartGame}
        style={{
          background: 'transparent',
          color: '#b07aff',
          border: '1px solid rgba(176,122,255,0.4)',
          borderRadius: '6px',
          padding: '0.5rem 1.5rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
          width: '240px',
        }}
      >
        ↺ Try Again
      </button>
    </div>
  );
};

export default GameOverScreen;
