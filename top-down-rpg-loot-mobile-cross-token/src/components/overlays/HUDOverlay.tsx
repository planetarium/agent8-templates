import React, { useEffect, useState } from 'react';
import styles from './HUDOverlay.module.css';
import { EventBus, EVENTS, HUDData } from '../../game/EventBus';

const HUDOverlay: React.FC = () => {
  const [hud, setHud] = useState<HUDData>({
    score: 0, floor: 1, gems: 0, hp: 5, maxHp: 5,
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

      {/* Floor — top center */}
      <div className={styles.floorBlock}>
        <div className={styles.floorLabel}>FLOOR</div>
        <div className={styles.floorValue}>{hud.floor}</div>
      </div>

      {/* Gems — top right */}
      <div className={styles.gemBlock}>
        <span className={styles.gemIcon}>◆</span>
        <span className={styles.gemValue}>{hud.gems}</span>
      </div>

      {/* HP — bottom left */}
      <div className={styles.hpBlock}>
        {Array.from({ length: hud.maxHp }).map((_, i) => (
          <div
            key={i}
            className={`${styles.hpHeart} ${i < hud.hp ? styles.hpAlive : styles.hpDead}`}
          >
            ♥
          </div>
        ))}
      </div>
    </div>
  );
};

export default HUDOverlay;
