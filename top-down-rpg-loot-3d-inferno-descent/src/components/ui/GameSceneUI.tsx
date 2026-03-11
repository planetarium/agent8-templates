import { useGameStore } from '../../stores/gameStore';
import { InputController } from './InputController';
import LoadingScreen from './LoadingScreen';
import InventoryHUD from './InventoryHUD';
import MiningProgressUI from './MiningProgressUI';
import QualitySettingsMenu from './QualitySettingsMenu';

/**
 * Game Scene UI Component
 *
 * This component manages UI overlays for the game scene.
 * It handles loading states and displays appropriate UI elements based on game state.
 */
const GameSceneUI = () => {
  const { isMapPhysicsReady } = useGameStore();

  return (
    <>
      {/* Input Controller - Global input management (keyboard, touch) */}
      <InputController disableJoystick={false} disableKeyboard={false} disabled={!isMapPhysicsReady} />
      {/* Inventory HUD - crystal counter */}
      {isMapPhysicsReady && <InventoryHUD />}
      {/* Mining progress bar */}
      {isMapPhysicsReady && <MiningProgressUI />}
      {/* Graphics quality settings — always visible */}
      <QualitySettingsMenu />
      {/* Loading Game Scene screen overlay */}
      {!isMapPhysicsReady && <LoadingScreen />}
    </>
  );
};

export default GameSceneUI;
