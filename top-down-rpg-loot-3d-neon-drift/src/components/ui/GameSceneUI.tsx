import { useGameStore } from '../../stores/gameStore';
import { InputController } from './InputController';
import LoadingScreen from './LoadingScreen';
import InventoryHUD from './InventoryHUD';
import HackingProgressUI from './MiningProgressUI';
import QualitySettingsMenu from './QualitySettingsMenu';

const GameSceneUI = () => {
  const { isMapPhysicsReady } = useGameStore();

  return (
    <>
      <InputController disableJoystick={false} disableKeyboard={false} disabled={!isMapPhysicsReady} />
      {isMapPhysicsReady && <InventoryHUD />}
      {isMapPhysicsReady && <HackingProgressUI />}
      <QualitySettingsMenu />
      {!isMapPhysicsReady && <LoadingScreen />}
    </>
  );
};

export default GameSceneUI;
