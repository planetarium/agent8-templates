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

  const best = parseInt(localStorage.getItem('shadowdungeon_best') || '0', 10);
  const isNewBest = data.score >= best && data.score > 0;

  return (
    <div className={`${styles.root} ${styles.visible}`}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>YOU HAVE FALLEN</div>
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
            <div className={styles.newBest}>&#9760; NEW RECORD &#9760;</div>
          )}

          <div className={styles.divider} />

          <div className={styles.statRow}>
            <span className={styles.statLabel}>FLOOR</span>
            <span className={`${styles.statValue} ${styles.statOrange}`}>{data.wave}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>SOUL GEMS</span>
            <span className={`${styles.statValue} ${styles.statPurple}`}>
              <span className={styles.soulIcon}>&#9830;</span> {data.soulgems}
            </span>
          </div>

          {data.soulgems > 0 && (
            <div className={styles.exchangeHint}>
              {data.soulgems} soul gems &#8594; {Math.floor(data.soulgems / 100)} SDT token{data.soulgems >= 100 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPlay}`}
            onClick={() => goScene('GameScene')}
          >
            <span>&#9760; DESCEND AGAIN</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnExchange}`}
            onClick={() => goScene('WalletScene', { soulgems: data.soulgems })}
          >
            <span>&#9830; EXCHANGE SOUL GEMS</span>
            <span className={styles.btnShine} />
          </button>

          <button
            className={`${styles.btn} ${styles.btnMenu}`}
            onClick={() => goScene('TitleScene')}
          >
            <span>&#8962; MAIN CHAMBER</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverOverlay;
