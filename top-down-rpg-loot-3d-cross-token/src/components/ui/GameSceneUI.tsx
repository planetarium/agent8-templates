import { useGameStore } from '../../stores/gameStore';
import { InputController } from './InputController';
import LoadingScreen from './LoadingScreen';
import TitleScreen from './TitleScreen';
import HUDOverlay from './HUDOverlay';
import GameOverScreen from './GameOverScreen';
import WalletScreen from './WalletScreen';
import CrossRampOverlay from './CrossRampOverlay';

/**
 * GameSceneUI — renders the appropriate overlay based on game phase.
 * [CHANGE] Replace overlay components with concept-specific UI.
 */
const GameSceneUI = () => {
  const { isMapPhysicsReady, gamePhase } = useGameStore();

  return (
    <>
      {/* Input — disabled until physics ready and during non-play phases */}
      <InputController
        disabled={!isMapPhysicsReady || gamePhase !== 'playing'}
        disableJoystick={false}
        disableKeyboard={false}
      />

      {/* Phase overlays */}
      {!isMapPhysicsReady && <LoadingScreen />}
      {isMapPhysicsReady && gamePhase === 'title' && <TitleScreen />}
      {isMapPhysicsReady && gamePhase === 'playing' && <HUDOverlay />}
      {isMapPhysicsReady && gamePhase === 'gameover' && <GameOverScreen />}
      {isMapPhysicsReady && gamePhase === 'wallet' && <WalletScreen />}
      {isMapPhysicsReady && gamePhase === 'crossramp' && <CrossRampOverlay />}
    </>
  );
};

export default GameSceneUI;
