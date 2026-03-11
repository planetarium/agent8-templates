import React from 'react';
import styles from './CrossRampOverlay.module.css';

interface Props {
  visible: boolean;
}

const CrossRampOverlay: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <div className={styles.logo}>
          <span className={styles.logoRing} />
          <span className={styles.logoInner}>&#x1F33F;</span>
        </div>
        <div className={styles.title}>CROSS MINI HUB</div>
        <div className={styles.sub}>Opening garden exchange...</div>
        <div className={styles.bar}>
          <div className={styles.barFill} />
        </div>
      </div>
    </div>
  );
};

export default CrossRampOverlay;
