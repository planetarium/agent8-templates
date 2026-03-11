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
      <div className={styles.stars} />
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoStar}>★</span>
          <span className={styles.logoText}>CYBER FIGHTER</span>
          <span className={styles.logoStar}>★</span>
        </div>
        <div className={styles.subtitle}>NEON ARCADE</div>

        <div className={styles.barWrap}>
          <div
            className={styles.barFill}
            style={{ width: `${progress * 100}%` }}
          />
          <div className={styles.barGlow} style={{ left: `${progress * 100}%` }} />
        </div>
        <div className={styles.barLabel}>LOADING... {Math.floor(progress * 100)}%</div>

        <div className={styles.scanline} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
