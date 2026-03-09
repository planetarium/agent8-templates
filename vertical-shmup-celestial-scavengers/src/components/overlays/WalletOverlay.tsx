import React from 'react';
import styles from './WalletOverlay.module.css';

interface Props {
  gameRef: React.RefObject<Phaser.Game | null>;
  onOpenCrossRamp: () => void;
  crossRampLoading: boolean;
  exchangeRate?: number;
  tokenSymbol?: string;
  collectibleName?: string;
}

const WalletOverlay: React.FC<Props> = ({
  gameRef,
  onOpenCrossRamp,
  crossRampLoading,
  exchangeRate = 100,
  tokenSymbol = 'CST',
  collectibleName = 'SHARDS',
}) => {
  const goBack = () => {
    const game = gameRef.current;
    if (!game) return;
    // Use WalletScene's own method to properly stop the scene before starting TitleScene
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
      <div className={styles.vignette} />

      <div className={styles.panel}>
        {/* Title */}
        <div className={styles.header}>
          <div className={styles.headerAccent}>CROSS MINI HUB Integration</div>
          <h2 className={styles.title}>
            <span className={styles.titleStar}>✧</span>
            {collectibleName} EXCHANGE
            <span className={styles.titleStar}>✧</span>
          </h2>
          <div className={styles.titleLine} />
        </div>

        {/* Info cards */}
        <div className={styles.infoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>✧</div>
            <div className={styles.cardText}>Harvest {collectibleName} in the Celestial Garden</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>✨</div>
            <div className={styles.cardText}>Ascend them into {tokenSymbol} on-chain tokens</div>
          </div>
        </div>

        {/* Exchange rate */}
        <div className={styles.rateBox}>
          <div className={styles.rateItem}>
            <div className={styles.rateValue}>{exchangeRate}</div>
            <div className={styles.rateLabel}>{collectibleName}</div>
          </div>
          <div className={styles.rateArrow}>
            <span className={styles.arrowLine} />
            <span className={styles.arrowText}>ASCENDS TO</span>
            <span className={styles.arrowLine} />
          </div>
          <div className={styles.rateItem}>
            <div className={`${styles.rateValue} ${styles.rateValueGold}`}>1</div>
            <div className={`${styles.rateLabel} ${styles.rateLabelGold}`}>{tokenSymbol} TOKEN</div>
          </div>
        </div>

        {/* Token badge */}
        <div className={styles.tokenBadge}>
          <span className={styles.tokenSymbol}>{tokenSymbol}</span>
          <span className={styles.tokenName}>Celestial Shard Token</span>
          <span className={styles.tokenChain}>CROSS NETWORK</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnCross} ${crossRampLoading ? styles.btnLoading : ''}`}
            onClick={onOpenCrossRamp}
            disabled={crossRampLoading}
          >
            {crossRampLoading ? (
              <>
                <span className={styles.spinner} />
                <span>COMMUNING...</span>
              </>
            ) : (
              <>
                <span>✧</span>
                <span>OPEN CROSS MINI HUB</span>
              </>
            )}
            <span className={styles.btnShine} />
          </button>

          <button className={`${styles.btn} ${styles.btnBack}`} onClick={goBack}>
            <span>← RETURN TO GARDEN</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletOverlay;
