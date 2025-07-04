import { useGameStore } from '../../stores/gameStore';
import Crosshair from './Crosshair';
import { InputController } from './InputController';
import LoadingScreen from './LoadingScreen';
import TileSelector from './TileSelector';

/**
 * Game Scene UI Component
 *
 * This component manages UI overlays for the game scene.
 * It handles loading states and displays appropriate UI elements based on game state.
 */
const GameSceneUI = () => {
  // ⚠️ MUST CHECK: Map physics system ready state
  // Physics paused and loading screen displayed while this value is false
  const { isMapPhysicsReady } = useGameStore();

  return (
    <>
      {/* Input Controller - Global input management (keyboard, touch) */}
      <InputController disableJoystick={false} disableKeyboard={false} disabled={!isMapPhysicsReady} />
      {/* Loading Game Scene screen overlay */}
      {!isMapPhysicsReady && <LoadingScreen />}
      <TileSelector />
      <Crosshair />
    </>
  );
};

export default GameSceneUI;
