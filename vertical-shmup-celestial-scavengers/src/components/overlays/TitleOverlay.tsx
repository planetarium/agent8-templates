import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('celestial_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [shardsBalance, setShardsBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load shards balance from server
  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getStardustBalance', []);
        setShardsBalance(result.balance ?? 0);
      } catch (e) {
        setShardsBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Re-fetch whenever shards are claimed
    const onBalance = ({ balance }: { balance: number }) => {
      setShardsBalance(balance);
    };
    EventBus.on(EVENTS.STARDUST_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.STARDUST_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const cstTokens = shardsBalance !== null ? Math.floor(shardsBalance / 100) : null;

  return (
    <div className={styles.root}>
      {/* Ethereal Vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>✧ MYSTICAL ARCADE ✧</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>CELESTIAL</span>
          <span className={styles.titleLine2}>SCAVENGERS</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>HIGH SOUL</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Shards balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>✧</span>
          <span className={styles.balanceLabel}>SPIRIT SHARDS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : shardsBalance !== null ? shardsBalance.toLocaleString() : '--'}
          </span>
        </div>
        {cstTokens !== null && cstTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{cstTokens}</span> CST ready to claim
          </div>
        )}
        {cstTokens !== null && shardsBalance !== null && shardsBalance > 0 && cstTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {100 - (shardsBalance % 100)} more for a CST
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>✧</span>
          <span>ENTER THE GARDEN</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>✧</span>
          <span>TOKEN EXCHANGE</span>
          {shardsBalance !== null && shardsBalance > 0 && (
            <span className={styles.btnBadge}>{shardsBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO FLY · AUTO STRIKE</div>
    </div>
  );
};

export default TitleOverlay;
