import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

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
          background: linear-gradient(180deg, #0d1f0d 0%, #1a2e1a 50%, #0a1a0a 100%);
          color: #c4a265;
          width: 100%;
          height: 100%;
          font-family: 'Cinzel', serif;
        }
        .loading-title {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 1rem;
          letter-spacing: 6px;
          text-shadow: 0 0 15px rgba(196,162,101,0.5);
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(196, 162, 101, 0.2);
          border-radius: 50%;
          border-top-color: #c4a265;
          border-right-color: #6b8f4e;
          animation: spin 1.2s ease-in-out infinite;
          box-shadow: 0 0 15px rgba(196, 162, 101, 0.3);
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div className="loading-container">
        <h2 className="loading-title">ENTERING GROVE</h2>
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
