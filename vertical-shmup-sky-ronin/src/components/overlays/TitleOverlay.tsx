import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('skyronin_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [stardustBalance, setStardustBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load stardust balance from server
  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getStardustBalance', []);
        setStardustBalance(result.balance ?? 0);
      } catch (e) {
        setStardustBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Re-fetch whenever stardust is claimed
    const onBalance = ({ balance }: { balance: number }) => {
      setStardustBalance(balance);
    };
    EventBus.on(EVENTS.STARDUST_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.STARDUST_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const sbtTokens = stardustBalance !== null ? Math.floor(stardustBalance / 100) : null;
  // Sky Ronin: 100 Spirit Orbs = 1 SRT token

  return (
    <div className={styles.root}>
      {/* CRT Scanlines */}
      <div className={styles.scanlines} />

      {/* Top vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>⚔ FEUDAL SKY SHOOTER ⚔</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>SKY</span>
          <span className={styles.titleLine2}>RONIN</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Stardust balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>◉</span>
          <span className={styles.balanceLabel}>SPIRIT ORBS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : stardustBalance !== null ? stardustBalance.toLocaleString() : '--'}
          </span>
        </div>
        {sbtTokens !== null && sbtTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{sbtTokens}</span> SRT exchangeable
          </div>
        )}
        {sbtTokens !== null && stardustBalance !== null && stardustBalance > 0 && sbtTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {100 - (stardustBalance % 100)} more to next SRT
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>▶</span>
          <span>TAP TO PLAY</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>◉</span>
          <span>EXCHANGE SPIRIT ORBS</span>
          {stardustBalance !== null && stardustBalance > 0 && (
            <span className={styles.btnBadge}>{stardustBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO MOVE · AUTO FIRE · HONOR THE SKIES</div>
    </div>
  );
};

export default TitleOverlay;
