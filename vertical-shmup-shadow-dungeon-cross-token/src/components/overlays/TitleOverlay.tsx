import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('shadowdungeon_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [soulgemBalance, setSoulgemBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load soul gem balance from server
  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getSoulgemBalance', []);
        setSoulgemBalance(result.balance ?? 0);
      } catch (e) {
        setSoulgemBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Re-fetch whenever soulgems are claimed
    const onBalance = ({ balance }: { balance: number }) => {
      setSoulgemBalance(balance);
    };
    EventBus.on(EVENTS.SOULGEM_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.SOULGEM_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const sdtTokens = soulgemBalance !== null ? Math.floor(soulgemBalance / 100) : null;

  return (
    <div className={styles.root}>
      {/* Dark vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>&#9876; DARK FANTASY CRAWLER &#9876;</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>SHADOW</span>
          <span className={styles.titleLine2}>DUNGEON</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>DEEPEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Soul gem balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>&#9830;</span>
          <span className={styles.balanceLabel}>SOUL GEMS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : soulgemBalance !== null ? soulgemBalance.toLocaleString() : '--'}
          </span>
        </div>
        {sdtTokens !== null && sdtTokens > 0 && (
          <div className={styles.balanceSdt}>
            &#8594; <span className={styles.sdtCount}>{sdtTokens}</span> SDT exchangeable
          </div>
        )}
        {sdtTokens !== null && soulgemBalance !== null && soulgemBalance > 0 && sdtTokens === 0 && (
          <div className={styles.balanceSdtHint}>
            {100 - (soulgemBalance % 100)} more to next SDT
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>&#9760;</span>
          <span>ENTER THE DUNGEON</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>&#9830;</span>
          <span>SOUL GEM EXCHANGE</span>
          {soulgemBalance !== null && soulgemBalance > 0 && (
            <span className={styles.btnBadge}>{soulgemBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO MOVE &#183; AUTO CAST</div>
    </div>
  );
};

export default TitleOverlay;
