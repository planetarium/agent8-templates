import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * Loading screen component - Volcanic theme
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
        .loading-container {
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0a0000 0%, #1a0500 100%);
          color: #ff8844;
          width: 100%;
          height: 100%;
        }
        .loading-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          letter-spacing: 3px;
          text-shadow: 0 0 10px rgba(255, 80, 0, 0.5);
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 80, 0, 0.2);
          border-radius: 50%;
          border-top-color: #ff6600;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div className="loading-container">
        <h2 className="loading-title">Descending...</h2>
        <div className="spinner"></div>
      </div>
    </div>
  );

  if (isInThreeCanvas) {
    return (
      <Html
        center
        style={{
          width: '100vw',
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {loadingContent}
      </Html>
    );
  }

  return loadingContent;
};

export default LoadingScreen;
