import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('shadowdojo_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [soulBalance, setSoulBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load soul balance from server
  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getStardustBalance', []);
        setSoulBalance(result.balance ?? 0);
      } catch (e) {
        setSoulBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Re-fetch whenever souls are claimed
    const onBalance = ({ balance }: { balance: number }) => {
      setSoulBalance(balance);
    };
    EventBus.on(EVENTS.SOUL_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.SOUL_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const sdtTokens = soulBalance !== null ? Math.floor(soulBalance / 100) : null;

  return (
    <div className={styles.root}>
      {/* Dark scanlines */}
      <div className={styles.scanlines} />

      {/* Dark vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>⛩ DEMON SLAYER ⛩</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>SHADOW</span>
          <span className={styles.titleLine2}>DOJO</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Soul balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>魂</span>
          <span className={styles.balanceLabel}>SOULS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : soulBalance !== null ? soulBalance.toLocaleString() : '--'}
          </span>
        </div>
        {sdtTokens !== null && sdtTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{sdtTokens}</span> SDT exchangeable
          </div>
        )}
        {sdtTokens !== null && soulBalance !== null && soulBalance > 0 && sdtTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {100 - (soulBalance % 100)} more to next SDT
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>⚔</span>
          <span>ENTER THE DOJO</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>魂</span>
          <span>SOUL EXCHANGE</span>
          {soulBalance !== null && soulBalance > 0 && (
            <span className={styles.btnBadge}>{soulBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO MOVE · AUTO STRIKE</div>
    </div>
  );
};

export default TitleOverlay;
