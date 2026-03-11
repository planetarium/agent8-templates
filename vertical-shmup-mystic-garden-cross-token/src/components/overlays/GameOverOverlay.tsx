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
    const onGameOver = (d: GameOverData) => {
      setData(d);
    };
    EventBus.on(EVENTS.GAME_OVER, onGameOver);
    return () => {
      EventBus.off(EVENTS.GAME_OVER, onGameOver);
    };
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

  const best = parseInt(localStorage.getItem('mysticgarden_best') || '0', 10);
  const isNewBest = data.score >= best && data.score > 0;

  return (
    <div className={`${styles.root} ${styles.visible}`}>
      <div className={styles.leafOverlay} />

      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>GARDEN WITHERED</div>
          <div className={styles.titleUnderline} />
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>SCORE</span>
            <span className={`${styles.statValue} ${isNewBest ? styles.statGold : ''}`}>
              {data.score.toLocaleString()}
            </span>
          </div>

          {isNewBest && (
            <div className={styles.newBest}>&#x1F33F; NEW BEST &#x1F33F;</div>
          )}

          <div className={styles.divider} />

          <div className={styles.statRow}>
            <span className={styles.statLabel}>WAVE</span>
            <span className={`${styles.statValue} ${styles.statGreen}`}>{data.wave}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>PETALS</span>
            <span className={`${styles.statValue} ${styles.statPink}`}>
              <span className={styles.petalIcon}>&#x1F33A;</span> {data.petals}
            </span>
          </div>

          {data.petals > 0 && (
            <div className={styles.exchangeHint}>
              {data.petals} petals &rarr; {Math.floor(data.petals / 100)} MGT token{data.petals >= 100 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPlay}`}
            onClick={() => goScene('GameScene')}
          >
            <span>&#x1F331; GROW AGAIN</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnExchange}`}
            onClick={() => goScene('WalletScene', { petals: data.petals })}
          >
            <span>&#x1F33A; EXCHANGE PETALS</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnMenu}`}
            onClick={() => goScene('TitleScene')}
          >
            <span>&#x1F3E1; MAIN GARDEN</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverOverlay;
