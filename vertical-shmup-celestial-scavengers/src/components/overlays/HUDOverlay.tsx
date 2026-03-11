import React, { useEffect, useState } from 'react';
import styles from './HUDOverlay.module.css';
import { EventBus, EVENTS, HUDData } from '../../game/EventBus';

const HUDOverlay: React.FC = () => {
  const [hud, setHud] = useState<HUDData>({
    score: 0, wave: 1, stardust: 0, hp: 3, maxHp: 3,
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
        <div className={styles.label}>SOUL RESONANCE</div>
        <div className={styles.scoreValue}>{hud.score.toLocaleString()}</div>
      </div>

      {/* Wave — top center */}
      <div className={styles.waveBlock}>
        <div className={styles.waveLabel}>GARDEN LAYER</div>
        <div className={styles.waveValue}>{hud.wave}</div>
      </div>

      {/* Shards — top right */}
      <div className={styles.stardustBlock}>
        <span className={styles.starIcon}>✧</span>
        <span className={styles.starValue}>{hud.stardust}</span>
      </div>

      {/* HP — bottom left */}
      <div className={styles.hpBlock}>
        {Array.from({ length: hud.maxHp }).map((_, i) => (
          <div
            key={i}
            className={`${styles.hpOrb} ${i < hud.hp ? styles.hpAlive : styles.hpDead}`}
          >
            ✧
          </div>
        ))}
      </div>
    </div>
  );
};

export default HUDOverlay;
