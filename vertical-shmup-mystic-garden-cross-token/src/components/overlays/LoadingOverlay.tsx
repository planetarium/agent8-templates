import React, { useEffect, useState } from 'react';
import styles from './LoadingOverlay.module.css';
import { EventBus, EVENTS } from '../../game/EventBus';

const LoadingOverlay: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onProgress = ({ value }: { value: number }) => setProgress(value);
    EventBus.on(EVENTS.BOOT_PROGRESS, onProgress);
    return () => { EventBus.off(EVENTS.BOOT_PROGRESS, onProgress); };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.fireflies} />
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoLeaf}>&#x1F33F;</span>
          <span className={styles.logoText}>MYSTIC GARDEN</span>
          <span className={styles.logoLeaf}>&#x1F33F;</span>
        </div>
        <div className={styles.subtitle}>GARDEN DEFENSE</div>

        <div className={styles.barWrap}>
          <div
            className={styles.barFill}
            style={{ width: `${progress * 100}%` }}
          />
          <div className={styles.barGlow} style={{ left: `${progress * 100}%` }} />
        </div>
        <div className={styles.barLabel}>GROWING... {Math.floor(progress * 100)}%</div>

        <div className={styles.vines} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
