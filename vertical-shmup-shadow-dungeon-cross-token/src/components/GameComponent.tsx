import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createGame } from '../game/Game';
import { useGameServer } from '@agent8/gameserver';
import { EventBus, EVENTS } from '../game/EventBus';

// Overlay components
import LoadingOverlay from './overlays/LoadingOverlay';
import TitleOverlay from './overlays/TitleOverlay';
import HUDOverlay from './overlays/HUDOverlay';
import GameOverOverlay from './overlays/GameOverOverlay';
import WalletOverlay from './overlays/WalletOverlay';
import CrossRampOverlay from './overlays/CrossRampOverlay';

type Scene = 'BootScene' | 'TitleScene' | 'GameScene' | 'GameOverScene' | 'WalletScene' | '';

const GameComponent: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const { connected, server } = useGameServer();
  const [crossRampLoading, setCrossRampLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState<Scene>('BootScene');
  const claimPendingRef = useRef(false);
  const [gameOverData, setGameOverData] = useState<import('../game/EventBus').GameOverData | null>(null);
  const [gameConfig, setGameConfig] = useState<{ exchangeRate: number; tokenSymbol: string; collectibleName: string } | null>(null);

  // ── Fetch game config (exchange rate etc.) ───────────────────
  useEffect(() => {
    if (!connected || !server) return;
    server.remoteFunction('getGameConfig', []).then((cfg: any) => {
      if (cfg) setGameConfig(cfg);
    }).catch(() => {});
  }, [connected, server]);

  // ── CrossRamp handler ────────────────────────────────────────
  const openCrossRamp = useCallback(async () => {
    if (!connected || !server) {
      alert('Please wait for connection...');
      return;
    }
    setCrossRampLoading(true);
    try {
      const url = await server.getCrossRampShopUrl('en');
      window.open(url, 'CrossRampShop', 'width=1024,height=768');
    } catch (error) {
      console.error('Failed to open CROSS Mini Hub:', error);
      alert('Failed to open exchange. Please try again.');
    } finally {
      setCrossRampLoading(false);
    }
  }, [connected, server]);

  // ── Claim soul gems after game over ──────────────────────────
  const claimSoulgems = useCallback(async (amount: number) => {
    if (!connected || !server || amount <= 0 || claimPendingRef.current) return;
    claimPendingRef.current = true;
    try {
      const result = await server.remoteFunction('claimSoulgems', [amount]);
      if (result?.balance !== undefined) {
        EventBus.emit(EVENTS.SOULGEM_BALANCE, { balance: result.balance });
      }
    } catch (error) {
      console.error('Failed to claim soul gems:', error);
    } finally {
      claimPendingRef.current = false;
    }
  }, [connected, server]);

  // ── Init Phaser + EventBus ───────────────────────────────────
  useEffect(() => {
    if (gameContainerRef.current && !gameInstanceRef.current) {
      gameInstanceRef.current = createGame(gameContainerRef.current.id);
    }

    const onSceneChange = ({ scene }: { scene: string }) => {
      setCurrentScene(scene as Scene);
    };

    const onGameOver = (data: import('../game/EventBus').GameOverData) => {
      setGameOverData(data);
      if (data?.soulgemsPending > 0) {
        claimSoulgems(data.soulgemsPending);
      }
    };

    EventBus.on(EVENTS.SCENE_CHANGE, onSceneChange);
    EventBus.on(EVENTS.OPEN_CROSS_RAMP, openCrossRamp);
    EventBus.on(EVENTS.GAME_OVER, onGameOver);

    return () => {
      EventBus.off(EVENTS.SCENE_CHANGE, onSceneChange);
      EventBus.off(EVENTS.OPEN_CROSS_RAMP, openCrossRamp);
      EventBus.off(EVENTS.GAME_OVER, onGameOver);
    };
  }, [openCrossRamp, claimSoulgems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#0a0510' }}>
      {/* Phaser canvas */}
      <div
        id="phaser-game"
        ref={gameContainerRef}
        style={{ width: '100%', height: '100vh', background: '#0a0510' }}
      />

      {/* ── React UI Overlays ── */}

      {/* Boot loading screen */}
      {currentScene === 'BootScene' && <LoadingOverlay />}

      {/* Title screen UI */}
      {currentScene === 'TitleScene' && (
        <TitleOverlay gameRef={gameInstanceRef} />
      )}

      {/* In-game HUD — only during gameplay */}
      {currentScene === 'GameScene' && <HUDOverlay />}

      {/* Game Over screen — only during game over scene */}
      {currentScene === 'GameOverScene' && <GameOverOverlay gameRef={gameInstanceRef} initialData={gameOverData} />}

      {/* Wallet / Exchange screen — only during wallet scene */}
      {currentScene === 'WalletScene' && (
        <WalletOverlay
          gameRef={gameInstanceRef}
          onOpenCrossRamp={openCrossRamp}
          crossRampLoading={crossRampLoading}
          exchangeRate={gameConfig?.exchangeRate ?? 100}
          tokenSymbol={gameConfig?.tokenSymbol ?? 'SDT'}
          collectibleName={gameConfig?.collectibleName ?? 'SOUL GEM'}
        />
      )}

      {/* CrossRamp loading spinner */}
      <CrossRampOverlay visible={crossRampLoading} />
    </div>
  );
};

export default GameComponent;
