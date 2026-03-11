import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * In-canvas loading screen – Frost Garden theme
 * Shown when Suspense triggers inside the 3D canvas.
 * Uses a rotating snowflake icon + gentle snowfall CSS particles.
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
        .frost-loading-bg {
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #060e1e 0%, #0d1a32 50%, #15264a 100%);
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        /* ── Snowflake icon ── */
        .frost-loading-icon {
          width: 42px;
          height: 42px;
          margin-bottom: 14px;
          animation: frostSpin 6s linear infinite;
          filter: drop-shadow(0 0 8px rgba(100,180,255,0.4));
        }

        /* ── Title text ── */
        .frost-loading-title {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 4px;
          color: #8cc8f0;
          text-shadow: 0 0 12px rgba(100, 180, 255, 0.35);
          margin-bottom: 16px;
          animation: frostPulseText 2.5s ease-in-out infinite;
        }

        /* ── Dot pulse indicator ── */
        .frost-dots {
          display: flex;
          gap: 6px;
        }
        .frost-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5599cc;
          animation: frostDotBounce 1.4s ease-in-out infinite;
        }
        .frost-dot:nth-child(2) { animation-delay: 0.2s; }
        .frost-dot:nth-child(3) { animation-delay: 0.4s; }

        /* ── Background particles ── */
        .frost-particle {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          pointer-events: none;
          animation: frostFall linear infinite;
        }

        @keyframes frostSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes frostPulseText {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes frostDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes frostFall {
          0%   { transform: translateY(-5vh) translateX(0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(105vh) translateX(15px); opacity: 0; }
        }
      `}</style>

      <div className="frost-loading-bg">
        {/* Simple CSS snow particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="frost-particle"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.15 + Math.random() * 0.3,
              animationDuration: `${4 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 4}s`,
              boxShadow: `0 0 ${3 + Math.random() * 4}px rgba(180,220,255,0.3)`,
            }}
          />
        ))}

        {/* Snowflake SVG icon */}
        <svg className="frost-loading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M12 2L9 5M12 2L15 5M12 22L9 19M12 22L15 19" stroke="#8cc8f0" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.93 4.93L19.07 19.07M4.93 4.93L5.5 8.5M4.93 4.93L8.5 5.5M19.07 19.07L18.5 15.5M19.07 19.07L15.5 18.5" stroke="#8cc8f0" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.93 19.07L19.07 4.93M4.93 19.07L8.5 18.5M4.93 19.07L5.5 15.5M19.07 4.93L15.5 5.5M19.07 4.93L18.5 8.5" stroke="#8cc8f0" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="#8cc8f0" opacity="0.5" />
        </svg>

        <h2 className="frost-loading-title">FROST GARDEN</h2>

        <div className="frost-dots">
          <div className="frost-dot" />
          <div className="frost-dot" />
          <div className="frost-dot" />
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
