import React from 'react';
import styles from './WalletOverlay.module.css';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
  onOpenCrossRamp: () => void;
  crossRampLoading: boolean;
}

const WalletOverlay: React.FC<Props> = ({ gameRef, onOpenCrossRamp, crossRampLoading }) => {
  const goBack = () => {
    const game = gameRef.current;
    if (!game) return;
    const walletScene = game.scene.getScene('WalletScene') as any;
    if (walletScene && walletScene.goBackToTitle) {
      walletScene.goBackToTitle();
    } else {
      game.scene.stop('WalletScene');
      game.scene.start('TitleScene');
    }
  };

  return (
    <div className={`${styles.root} ${styles.visible}`}>
      <div className={styles.scanlines} />

      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerAccent}>CROSS MINI HUB</div>
          <h2 className={styles.title}>
            <span className={styles.titleGem}>◆</span>
            GEM EXCHANGE
            <span className={styles.titleGem}>◆</span>
          </h2>
          <div className={styles.titleLine} />
        </div>

        <div className={styles.infoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>⚔️</div>
            <div className={styles.cardText}>Defeat monsters and collect Gems during dungeon runs</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🔗</div>
            <div className={styles.cardText}>Exchange Gems for GDT on-chain tokens</div>
          </div>
        </div>

        <div className={styles.rateBox}>
          <div className={styles.rateItem}>
            <div className={styles.rateValue}>100</div>
            <div className={styles.rateLabel}>GEMS</div>
          </div>
          <div className={styles.rateArrow}>
            <span className={styles.arrowLine} />
            <span className={styles.arrowText}>EQUALS</span>
            <span className={styles.arrowLine} />
          </div>
          <div className={styles.rateItem}>
            <div className={`${styles.rateValue} ${styles.rateValueGold}`}>1</div>
            <div className={`${styles.rateLabel} ${styles.rateLabelGold}`}>GDT TOKEN</div>
          </div>
        </div>

        <div className={styles.tokenBadge}>
          <span className={styles.tokenSymbol}>GDT</span>
          <span className={styles.tokenName}>Gem Dungeon Token</span>
          <span className={styles.tokenChain}>CROSS NETWORK</span>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnCross} ${crossRampLoading ? styles.btnLoading : ''}`}
            onClick={onOpenCrossRamp}
            disabled={crossRampLoading}
          >
            {crossRampLoading ? (
              <>
                <span className={styles.spinner} />
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>OPEN CROSS MINI HUB</span>
              </>
            )}
            <span className={styles.btnShine} />
          </button>

          <button className={`${styles.btn} ${styles.btnBack}`} onClick={goBack}>
            <span>← BACK TO MENU</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletOverlay;
