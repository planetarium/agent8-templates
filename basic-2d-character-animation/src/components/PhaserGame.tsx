import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from '../game/main';
import { GameConstants } from '../game/constants/GameConstants';
import { EventKeys } from '../game/constants/EventKeys';
import { EventBus } from '../game/core/EventBus';

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface IProps {
  currentActiveScene?: (sceneInstance: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref) {
  const game = useRef<Phaser.Game | null>(null!);

  useLayoutEffect(() => {
    if (game.current === null) {
      game.current = StartGame(GameConstants.gameContainerId);

      if (typeof ref === 'function') {
        ref({ game: game.current, scene: null });
      } else if (ref) {
        ref.current = { game: game.current, scene: null };
      }
    }

    return () => {
      if (game.current) {
        game.current.destroy(true);
        if (game.current !== null) {
          game.current = null;
        }
      }
    };
  }, [ref]);

  useEffect(() => {
    EventBus.on(EventKeys.currentSceneReady, (sceneInstance: Phaser.Scene) => {
      if (currentActiveScene && typeof currentActiveScene === 'function') {
        currentActiveScene(sceneInstance);
      }

      if (typeof ref === 'function') {
        ref({ game: game.current, scene: sceneInstance });
      } else if (ref) {
        ref.current = { game: game.current, scene: sceneInstance };
      }
    });
    return () => {
      EventBus.removeListener(EventKeys.currentSceneReady);
    };
  }, [currentActiveScene, ref]);

  return <div id={GameConstants.gameContainerId}></div>;
});
