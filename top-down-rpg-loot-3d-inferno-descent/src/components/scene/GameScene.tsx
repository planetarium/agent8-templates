import GameSceneCanvas from '../r3f/GameSceneCanvas';
import GameSceneUI from '../ui/GameSceneUI';

/**
 * Main Game Scene Component
 *
 * This component serves as a layout container that arranges the game UI and 3D Canvas.
 *
 * 🚨 CRITICAL PERFORMANCE WARNING:
 * Re-rendering of this component triggers re-rendering of the entire 3D Canvas, causing severe performance degradation.
 *
 * Prohibited Actions:
 * - Using state management hooks like useState, useReducer
 * - Passing frequently changing values as props
 * - State updates inside useEffect
 * - Conditional rendering that changes component structure
 * - Creating inline objects/functions (e.g., style={{...}}, onClick={() => {}})
 *
 * Recommendations:
 * - Handle state management in child components (GameSceneUI, GameSceneCanvas)
 * - Access global state directly through zustand store or similar
 * - Memoize event handlers with useCallback before use
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
