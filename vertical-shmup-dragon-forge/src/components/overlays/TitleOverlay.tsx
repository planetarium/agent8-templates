import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('dragonforge_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [emberBalance, setEmberBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (!connected || !server) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getStardustBalance', []);
        setEmberBalance(result.balance ?? 0);
      } catch (e) {
        setEmberBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    const onBalance = ({ balance }: { balance: number }) => {
      setEmberBalance(balance);
    };
    EventBus.on(EVENTS.STARDUST_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.STARDUST_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const dftTokens = emberBalance !== null ? Math.floor(emberBalance / 10) : null;

  return (
    <div className={styles.root}>
      <div className={styles.scanlines} />
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>VOLCANIC SHMUP</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>DRAGON</span>
          <span className={styles.titleLine2}>FORGE</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Ember balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>&#x1F525;</span>
          <span className={styles.balanceLabel}>EMBERS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : emberBalance !== null ? emberBalance.toLocaleString() : '--'}
          </span>
        </div>
        {dftTokens !== null && dftTokens > 0 && (
          <div className={styles.balanceSbt}>
            &#x2192; <span className={styles.sbtCount}>{dftTokens}</span> DFT exchangeable
          </div>
        )}
        {dftTokens !== null && emberBalance !== null && emberBalance > 0 && dftTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {10 - (emberBalance % 10)} more to next DFT
          </div>
        )}
      </div>

      {/* Buttons */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>&#x25B6;</span>
          <span>UNLEASH THE DRAGON</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>&#x1F525;</span>
          <span>FORGE TOKENS</span>
          {emberBalance !== null && emberBalance > 0 && (
            <span className={styles.btnBadge}>{emberBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      <div className={styles.hint}>DRAG TO FLY &#xB7; AUTO FIRE</div>
    </div>
  );
};

export default TitleOverlay;
