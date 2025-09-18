import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import Crosshair from './Crosshair';
import { InputController } from './InputController';
import LoadingScreen from './LoadingScreen';

/**
 * Game Scene UI Component
 *
 * This component manages UI overlays for the game scene.
 * It handles loading states and displays appropriate UI elements based on game state.
 * Game becomes ready when either map physics is ready OR 3 seconds have elapsed.
 */
const GameSceneUI = () => {
  // ⚠️ MUST CHECK: Map physics system ready state
  // Physics paused and loading screen displayed while this value is false
  const { isMapPhysicsReady } = useGameStore();

  // Game ready state - becomes true when either map physics is ready OR 3 seconds have elapsed
  const [isGameReady, setIsGameReady] = useState(false);

  // Handle game ready logic when isMapPhysicsReady changes or on mount
  useEffect(() => {
    // If already ready, don't do anything
    if (isGameReady) return;

    if (isMapPhysicsReady) {
      setIsGameReady(true);
      return;
    }

    // Start 3-second timer if physics not ready
    const timer = setTimeout(() => {
      setIsGameReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMapPhysicsReady, isGameReady]);

  return (
    <>
      {/* Input Controller - Global input management (keyboard, touch) */}
      <InputController disableJoystick={false} disableKeyboard={false} disabled={!isGameReady} />

      {/* Loading Game Scene screen overlay */}
      {!isGameReady && <LoadingScreen />}

      {isGameReady && <Crosshair />}
    </>
  );
};

export default GameSceneUI;
