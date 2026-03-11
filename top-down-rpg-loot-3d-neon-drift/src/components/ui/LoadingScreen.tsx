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
          background: linear-gradient(135deg, #0a0014, #1a0030, #0a0014);
          color: #ff00ff;
          width: 100%;
          height: 100%;
          font-family: 'Orbitron', system-ui, sans-serif;
        }
        .loading-title {
          font-size: 1rem;
          font-weight: bold;
          margin-bottom: 1rem;
          letter-spacing: 6px;
          text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff60;
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(255, 0, 255, 0.2);
          border-radius: 0;
          border-top-color: #ff00ff;
          border-right-color: #00ffff;
          animation: spin 0.8s linear infinite;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="loading-container">
        <h2 className="loading-title">LOADING</h2>
        <div className="spinner"></div>
      </div>
    </div>
  );

  if (isInThreeCanvas) {
    return (
      <Html center style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {loadingContent}
      </Html>
    );
  }

  return loadingContent;
};

export default LoadingScreen;
