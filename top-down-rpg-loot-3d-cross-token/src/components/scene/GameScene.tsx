import GameSceneCanvas from '../r3f/GameSceneCanvas';
import GameSceneUI from '../ui/GameSceneUI';

/**
 * Main Game Scene Component — layout container only.
 *
 * 🚨 CRITICAL PERFORMANCE WARNING:
 * Re-rendering of this component triggers re-rendering of the entire 3D Canvas.
 *
 * Prohibited Actions:
 * - Using state management hooks like useState, useReducer
 * - Passing frequently changing values as props
 * - State updates inside useEffect
 * - Conditional rendering that changes component structure
 * - Creating inline objects/functions (e.g., style={{...}}, onClick={() => {}})
 *
 * Handle state in child components via zustand stores.
 */
const GameScene = () => {
  return (
    <div className="relative w-full h-screen">
      <GameSceneUI />
      <GameSceneCanvas />
    </div>
  );
};

export default GameScene;
