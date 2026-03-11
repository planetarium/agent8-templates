import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('deepreef_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [pearlBalance, setPearlBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getStardustBalance', []);
        setPearlBalance(result.balance ?? 0);
      } catch (_e) {
        setPearlBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    const onBalance = ({ balance }: { balance: number }) => {
      setPearlBalance(balance);
    };
    EventBus.on(EVENTS.STARDUST_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.STARDUST_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const reefTokens = pearlBalance !== null ? Math.floor(pearlBalance / 100) : null;

  return (
    <div className={styles.root}>
      <div className={styles.caustic} />
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>◉ DEEP SEA ARCADE ◉</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>DEEP</span>
          <span className={styles.titleLine2}>REEF</span>
          <span className={styles.titleLine3}>RAIDERS</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Pearl balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>◉</span>
          <span className={styles.balanceLabel}>PEARLS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : pearlBalance !== null ? pearlBalance.toLocaleString() : '--'}
          </span>
        </div>
        {reefTokens !== null && reefTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{reefTokens}</span> REEF exchangeable
          </div>
        )}
        {reefTokens !== null && pearlBalance !== null && pearlBalance > 0 && reefTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {100 - (pearlBalance % 100)} more to next REEF
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
          <span>DIVE IN</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>◉</span>
          <span>EXCHANGE PEARLS</span>
          {pearlBalance !== null && pearlBalance > 0 && (
            <span className={styles.btnBadge}>{pearlBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      <div className={styles.hint}>DRAG TO STEER · AUTO TORPEDOES</div>
    </div>
  );
};

export default TitleOverlay;
