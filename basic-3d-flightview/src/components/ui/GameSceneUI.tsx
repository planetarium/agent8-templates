import { useGameStore } from '../../stores/gameStore';
import LoadingScreen from './LoadingScreen';
import StatusDisplay from './StatusDisplay';

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
      {/* Loading Game Scene screen overlay */}
      {!isMapPhysicsReady && <LoadingScreen />}

      {/* UI Overlay */}
      {isMapPhysicsReady && <StatusDisplay />}
    </>
  );
};

export default GameSceneUI;
