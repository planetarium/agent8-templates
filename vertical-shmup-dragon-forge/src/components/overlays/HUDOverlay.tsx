import React, { useEffect, useState } from 'react';
import styles from './HUDOverlay.module.css';
import { EventBus, EVENTS, HUDData } from '../../game/EventBus';

const HUDOverlay: React.FC = () => {
  const [hud, setHud] = useState<HUDData>({
    score: 0, wave: 1, stardust: 0, hp: 5, maxHp: 5,
  });

  useEffect(() => {
    const onUpdate = (data: HUDData) => setHud({ ...data });
    EventBus.on(EVENTS.HUD_UPDATE, onUpdate);
    return () => { EventBus.off(EVENTS.HUD_UPDATE, onUpdate); };
  }, []);

  return (
    <div className={styles.root}>
      {/* Score — top left */}
      <div className={styles.scoreBlock}>
        <div className={styles.label}>SCORE</div>
        <div className={styles.scoreValue}>{hud.score.toLocaleString()}</div>
      </div>

      {/* Wave — top center */}
      <div className={styles.waveBlock}>
        <div className={styles.waveLabel}>WAVE</div>
        <div className={styles.waveValue}>{hud.wave}</div>
      </div>

      {/* Embers — top right */}
      <div className={styles.emberBlock}>
        <span className={styles.emberIcon}>&#x1F525;</span>
        <span className={styles.emberValue}>{hud.stardust}</span>
      </div>

      {/* HP — bottom left as fire orbs */}
      <div className={styles.hpBlock}>
        {Array.from({ length: hud.maxHp }).map((_, i) => (
          <div
            key={i}
            className={`${styles.hpOrb} ${i < hud.hp ? styles.hpAlive : styles.hpDead}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HUDOverlay;
