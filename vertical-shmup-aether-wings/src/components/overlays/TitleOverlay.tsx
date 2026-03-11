import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
  exchangeRate?: number;
  tokenSymbol?: string;
  collectibleName?: string;
}

const TitleOverlay: React.FC<Props> = ({
  gameRef,
  exchangeRate = 100,
  tokenSymbol = 'GLOW',
  collectibleName = 'LUMINA',
}) => {
  const best = parseInt(localStorage.getItem('aetherwings_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [stardustBalance, setStardustBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Load lumina balance from server
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

    // Re-fetch whenever lumina is claimed
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

  const awtTokens = stardustBalance !== null ? Math.floor(stardustBalance / exchangeRate) : null;

  return (
    <div className={styles.root}>
      {/* CRT Scanlines */}
      <div className={styles.scanlines} />

      {/* Top vignette */}
      <div className={styles.vignette} />

      {/* Title block */}
      <header className={styles.header}>
        <div className={styles.badge}>✧ CELESTIAL SHMUP ✧</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>AETHER</span>
          <span className={styles.titleLine2}>WINGS</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      {/* Best score */}
      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>HIGH SCORE</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      {/* Lumina balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>✧</span>
          <span className={styles.balanceLabel}>{collectibleName}</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : stardustBalance !== null ? stardustBalance.toLocaleString() : '--'}
          </span>
        </div>
        {awtTokens !== null && awtTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{awtTokens}</span> {tokenSymbol} exchangeable
          </div>
        )}
        {awtTokens !== null && stardustBalance !== null && stardustBalance > 0 && awtTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {exchangeRate - (stardustBalance % exchangeRate)} more to next {tokenSymbol}
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
          <span>ASCEND TO BATTLE</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>✧</span>
          <span>REDEEM {collectibleName}</span>
          {stardustBalance !== null && stardustBalance > 0 && (
            <span className={styles.btnBadge}>{stardustBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      {/* Footer hint */}
      <div className={styles.hint}>DRAG TO MANEUVER · AUTO LIGHT BOLTS</div>
    </div>
  );
};

export default TitleOverlay;
