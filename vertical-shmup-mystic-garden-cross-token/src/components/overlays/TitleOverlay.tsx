import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('mysticgarden_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [petalBalance, setPetalBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load petal balance from server
  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getPetalBalance', []);
        setPetalBalance(result.balance ?? 0);
      } catch (e) {
        setPetalBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Re-fetch whenever petals are claimed
    const onBalance = ({ balance }: { balance: number }) => {
      setPetalBalance(balance);
    };
    EventBus.on(EVENTS.PETAL_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.PETAL_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const mgtTokens = petalBalance !== null ? Math.floor(petalBalance / 100) : null;

  return (
    <div className={styles.root}>
      {/* Leaf pattern overlay */}
      <div className={styles.leafPattern} />

      {/* Top vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>&#x1F33F; GARDEN DEFENSE &#x1F33F;</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>MYSTIC</span>
          <span className={styles.titleLine2}>GARDEN</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Petal balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>&#x1F33A;</span>
          <span className={styles.balanceLabel}>PETALS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : petalBalance !== null ? petalBalance.toLocaleString() : '--'}
          </span>
        </div>
        {mgtTokens !== null && mgtTokens > 0 && (
          <div className={styles.balanceMgt}>
            &rarr; <span className={styles.mgtCount}>{mgtTokens}</span> MGT exchangeable
          </div>
        )}
        {mgtTokens !== null && petalBalance !== null && petalBalance > 0 && mgtTokens === 0 && (
          <div className={styles.balanceMgtHint}>
            {100 - (petalBalance % 100)} more to next MGT
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>&#x1F331;</span>
          <span>START GROWING</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>&#x1F33A;</span>
          <span>EXCHANGE PETALS</span>
          {petalBalance !== null && petalBalance > 0 && (
            <span className={styles.btnBadge}>{petalBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO MOVE &middot; AUTO THORN</div>
    </div>
  );
};

export default TitleOverlay;
