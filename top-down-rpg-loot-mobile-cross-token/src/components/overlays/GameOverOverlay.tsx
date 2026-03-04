import React, { useEffect, useState } from 'react';
import styles from './GameOverOverlay.module.css';
import { EventBus, EVENTS, GameOverData } from '../../game/EventBus';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
  initialData?: GameOverData | null;
}

const GameOverOverlay: React.FC<Props> = ({ gameRef, initialData }) => {
  const [data, setData] = useState<GameOverData | null>(initialData ?? null);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const onGameOver = (d: GameOverData) => setData(d);
    EventBus.on(EVENTS.GAME_OVER, onGameOver);
    return () => { EventBus.off(EVENTS.GAME_OVER, onGameOver); };
  }, []);

  const goScene = (key: string, payload?: object) => {
    const game = gameRef.current;
    if (!game) return;
    const gameOverScene = game.scene.getScene('GameOverScene') as any;
    if (gameOverScene && gameOverScene.goToScene) {
      gameOverScene.goToScene(key, payload);
    } else {
      game.scene.stop('GameOverScene');
      game.scene.start(key, payload);
    }
  };

  if (!data) return null;

  const best = parseInt(localStorage.getItem('crystaldungeon_best') || '0', 10);
  const isNewBest = data.score >= best && data.score > 0;

  return (
    <div className={`${styles.root} ${styles.visible}`}>
      <div className={styles.scanlines} />

      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>GAME OVER</div>
          <div className={styles.titleUnderline} />
        </div>

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>SCORE</span>
            <span className={`${styles.statValue} ${isNewBest ? styles.statGold : ''}`}>
              {data.score.toLocaleString()}
            </span>
          </div>

          {isNewBest && (
            <div className={styles.newBest}>★ NEW BEST ★</div>
          )}

          <div className={styles.divider} />

          <div className={styles.statRow}>
            <span className={styles.statLabel}>FLOOR</span>
            <span className={`${styles.statValue} ${styles.statPurple}`}>{data.floor}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>GEMS</span>
            <span className={`${styles.statValue} ${styles.statGreen}`}>
              <span className={styles.gemIcon}>◆</span> {data.gems}
            </span>
          </div>

          {data.gems > 0 && (
            <div className={styles.exchangeHint}>
              {data.gems} gems → {Math.floor(data.gems / 100)} GDT token{data.gems >= 100 ? 's' : ''}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPlay}`}
            onClick={() => goScene('GameScene')}
          >
            <span>▶ PLAY AGAIN</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnExchange}`}
            onClick={() => goScene('WalletScene', { gems: data.gems })}
          >
            <span>◆ EXCHANGE GEMS</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnMenu}`}
            onClick={() => goScene('TitleScene')}
          >
            <span>⌂ MAIN MENU</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverOverlay;
