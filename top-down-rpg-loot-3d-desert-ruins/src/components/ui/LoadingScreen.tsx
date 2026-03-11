import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * In-canvas loading screen – Desert Ruins theme
 * Uses a rotating sun icon + drifting sand CSS particles.
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
        .desert-loading-bg {
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #1a0e05 0%, #2d1a0a 50%, #4a2a10 100%);
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        /* ── Sun icon ── */
        .desert-loading-icon {
          width: 42px;
          height: 42px;
          margin-bottom: 14px;
          animation: desertSpin 8s linear infinite;
          filter: drop-shadow(0 0 8px rgba(232,180,80,0.4));
        }

        /* ── Title text ── */
        .desert-loading-title {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 4px;
          color: #e8c880;
          text-shadow: 0 0 12px rgba(232, 180, 80, 0.35);
          margin-bottom: 16px;
          animation: desertPulseText 2.5s ease-in-out infinite;
        }

        /* ── Dot pulse indicator ── */
        .desert-dots {
          display: flex;
          gap: 6px;
        }
        .desert-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #cc8830;
          animation: desertDotBounce 1.4s ease-in-out infinite;
        }
        .desert-dot:nth-child(2) { animation-delay: 0.2s; }
        .desert-dot:nth-child(3) { animation-delay: 0.4s; }

        /* ── Background particles ── */
        .desert-particle {
          position: absolute;
          border-radius: 50%;
          background: #e8c880;
          pointer-events: none;
          animation: desertDrift linear infinite;
        }

        @keyframes desertSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes desertPulseText {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes desertDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes desertDrift {
          0%   { transform: translateY(105vh) translateX(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-5vh) translateX(30px); opacity: 0; }
        }
      `}</style>

      <div className="desert-loading-bg">
        {/* CSS sand particles drifting upward */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="desert-particle"
            style={{
              width: 1.5 + Math.random() * 2.5,
              height: 1.5 + Math.random() * 2.5,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.25,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 4}s`,
              boxShadow: `0 0 ${2 + Math.random() * 3}px rgba(232,200,128,0.25)`,
            }}
          />
        ))}

        {/* Sun SVG icon */}
        <svg className="desert-loading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="4" fill="#e8c880" opacity="0.8" />
          <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#e8c880" strokeWidth="2" strokeLinecap="round" />
          <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#e8c880" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <h2 className="desert-loading-title">DESERT RUINS</h2>

        <div className="desert-dots">
          <div className="desert-dot" />
          <div className="desert-dot" />
          <div className="desert-dot" />
        </div>
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
