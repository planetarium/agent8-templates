import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * LoadingScreen — shown while map physics initializes.
 * Works both inside and outside Canvas (detects context via useThree).
 */
const LoadingScreen = () => {
  let isInThreeCanvas: boolean;
  try {
    useThree();
    isInThreeCanvas = true;
  } catch {
    isInThreeCanvas = false;
  }

  const loadingContent = (
    <div>
      <style>{`
        .dungeon-loading-container {
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 100%);
          color: white;
          width: 100%;
          height: 100%;
        }
        .dungeon-loading-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #b07aff;
        }
        .dungeon-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(176, 122, 255, 0.3);
          border-radius: 50%;
          border-top-color: #b07aff;
          animation: dungeon-spin 1s ease-in-out infinite;
        }
        @keyframes dungeon-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="dungeon-loading-container">
        <h2 className="dungeon-loading-title">◆ Loading</h2>
        <div className="dungeon-spinner"></div>
      </div>
    </div>
  );

  if (isInThreeCanvas) {
    return (
      <Html
        center
        style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {loadingContent}
      </Html>
    );
  }

  return loadingContent;
};

export default LoadingScreen;
