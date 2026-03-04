import React, { useEffect, useState } from 'react';
import styles from './TitleOverlay.module.css';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
}

const TitleOverlay: React.FC<Props> = ({ gameRef }) => {
  const best = parseInt(localStorage.getItem('crystaldungeon_best') || '0', 10);
  const { connected, server } = useGameServer();
  const [gemBalance, setGemBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (!connected || !server) return;
    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const result = await server.remoteFunction('getGemBalance', []);
        setGemBalance(result.balance ?? 0);
      } catch (_e) {
        setGemBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();

    const onBalance = ({ balance }: { balance: number }) => setGemBalance(balance);
    EventBus.on(EVENTS.GEM_BALANCE, onBalance);
    return () => { EventBus.off(EVENTS.GEM_BALANCE, onBalance); };
  }, [connected, server]);

  const goScene = (key: string) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.start(key);
  };

  const gdtTokens = gemBalance !== null ? Math.floor(gemBalance / 100) : null;

  return (
    <div className={styles.root}>
      <div className={styles.vignette} />

      <header className={styles.header}>
        <div className={styles.badge}>◆ DUNGEON RPG ◆</div>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>CRYSTAL</span>
          <span className={styles.titleLine2}>DUNGEON</span>
        </h1>
        <div className={styles.titleGlow} />
      </header>

      <div className={styles.bestScore}>
        <span className={styles.bestLabel}>BEST</span>
        <span className={styles.bestValue}>{best.toLocaleString()}</span>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceIcon}>◆</span>
          <span className={styles.balanceLabel}>GEMS</span>
          <span className={styles.balanceValue}>
            {loadingBalance ? '...' : gemBalance !== null ? gemBalance.toLocaleString() : '--'}
          </span>
        </div>
        {gdtTokens !== null && gdtTokens > 0 && (
          <div className={styles.balanceSbt}>
            → <span className={styles.sbtCount}>{gdtTokens}</span> GDT exchangeable
          </div>
        )}
        {gdtTokens !== null && gemBalance !== null && gemBalance > 0 && gdtTokens === 0 && (
          <div className={styles.balanceSbtHint}>
            {100 - (gemBalance % 100)} more gems to next GDT
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={() => goScene('GameScene')}
        >
          <span className={styles.btnIcon}>▶</span>
          <span>ENTER DUNGEON</span>
          <span className={styles.btnShine} />
        </button>

        <button
          className={`${styles.btn} ${styles.btnExchange}`}
          onClick={() => goScene('WalletScene')}
        >
          <span className={styles.btnIcon}>◆</span>
          <span>EXCHANGE GEMS</span>
          {gemBalance !== null && gemBalance > 0 && (
            <span className={styles.btnBadge}>{gemBalance}</span>
          )}
          <span className={styles.btnShine} />
        </button>
      </nav>

      <div className={styles.hint}>DRAG TO MOVE · AUTO ATTACK</div>
    </div>
  );
};

export default TitleOverlay;
