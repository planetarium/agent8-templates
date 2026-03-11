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
  tokenSymbol = 'SDT',
  collectibleName = 'SOUL GEM',
}) => {
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
      <div className={styles.panel}>
        {/* Title */}
        <div className={styles.header}>
          <div className={styles.headerAccent}>CROSS MINI HUB</div>
          <h2 className={styles.title}>
            <span className={styles.titleStar}>&#9830;</span>
            {collectibleName} EXCHANGE
            <span className={styles.titleStar}>&#9830;</span>
          </h2>
          <div className={styles.titleLine} />
        </div>

        {/* Info cards */}
        <div className={styles.infoCards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>&#9760;</div>
            <div className={styles.cardText}>Harvest {collectibleName}S from fallen foes</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>&#9830;</div>
            <div className={styles.cardText}>Exchange for {tokenSymbol} on-chain tokens</div>
          </div>
        </div>

        {/* Exchange rate */}
        <div className={styles.rateBox}>
          <div className={styles.rateItem}>
            <div className={styles.rateValue}>{exchangeRate}</div>
            <div className={styles.rateLabel}>{collectibleName}S</div>
          </div>
          <div className={styles.rateArrow}>
            <span className={styles.arrowLine} />
            <span className={styles.arrowText}>EQUALS</span>
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
          <span className={styles.tokenName}>{collectibleName} Token</span>
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
                <span>CHANNELING...</span>
              </>
            ) : (
              <>
                <span>&#9830;</span>
                <span>OPEN CROSS MINI HUB</span>
              </>
            )}
            <span className={styles.btnShine} />
          </button>

          <button className={`${styles.btn} ${styles.btnBack}`} onClick={goBack}>
            <span>&#8592; RETURN TO CHAMBER</span>
            <span className={styles.btnShine} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletOverlay;
