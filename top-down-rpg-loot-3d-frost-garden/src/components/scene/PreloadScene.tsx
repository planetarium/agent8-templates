import React, { useEffect, useRef, useState } from 'react';
import assets from '../../assets.json';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three-stdlib';
import { TextureLoader } from 'three';

interface PreloadSceneProps {
  onComplete: () => void;
}

type AssetCategory = Record<string, { url: string; [key: string]: unknown }>;
type LoadedAsset = GLTF | THREE.Texture | HTMLAudioElement | HTMLVideoElement | Response | null;

/* ── helper: flavour text that cycles while loading ── */
const TIPS = [
  'Weaving frost crystals...',
  'Summoning snowflakes...',
  'Awakening the frozen garden...',
  'Carving ice pillars...',
  'Planting starflower seeds...',
  'Painting the winter sky...',
];

const PreloadScene: React.FC<PreloadSceneProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  /* Snowflake data (generated once) */
  const snowflakes = useRef(
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 5 + 5,
      opacity: Math.random() * 0.45 + 0.15,
      drift: (Math.random() - 0.5) * 30,
    })),
  ).current;

  /* Cycle tips every 2.5s */
  useEffect(() => {
    const iv = setInterval(() => setTipIdx((p) => (p + 1) % TIPS.length), 2500);
    return () => clearInterval(iv);
  }, []);

  /* ── Asset preloading (unchanged logic) ── */
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const allUrls: string[] = [];
        const categories = Object.keys(assets);

        categories.forEach((category) => {
          const assetCategory = assets[category as keyof typeof assets] as AssetCategory;
          if (assetCategory && typeof assetCategory === 'object') {
            const categoryUrls = Object.values(assetCategory)
              .filter((item) => item && typeof item === 'object' && 'url' in item)
              .map((item) => item.url);
            allUrls.push(...categoryUrls);
          }
        });

        console.log(`Found ${allUrls.length} assets to preload`);

        const loadingManager = new THREE.LoadingManager();

        loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
          const currentProgress = Math.floor((itemsLoaded / itemsTotal) * 100);
          setProgress(currentProgress);
        };

        loadingManager.onLoad = () => {
          console.log('All assets preloaded successfully');
          setProgress(100);
          setIsComplete(true);
        };

        loadingManager.onError = (url) => {
          console.error(`Loading error: ${url}`);
        };

        const loadPromises = allUrls.map((url) => {
          const fileExtension = url.split('.').pop()?.toLowerCase();

          return new Promise<LoadedAsset>((resolve) => {
            if (fileExtension === 'glb' || fileExtension === 'gltf') {
              const loader = new GLTFLoader(loadingManager);
              loader.load(url, (gltf) => resolve(gltf), undefined, () => resolve(null));
            } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
              const loader = new TextureLoader(loadingManager);
              loader.load(url, (texture) => resolve(texture), undefined, () => resolve(null));
            } else if (['mp3', 'wav', 'ogg'].includes(fileExtension || '')) {
              const audio = new Audio();
              audio.src = url;
              audio.addEventListener('canplaythrough', () => resolve(audio));
              audio.addEventListener('error', () => resolve(null));
              audio.load();
            } else if (['mp4', 'webm'].includes(fileExtension || '')) {
              const video = document.createElement('video');
              video.src = url;
              video.preload = 'auto';
              video.addEventListener('canplaythrough', () => resolve(video));
              video.addEventListener('error', () => resolve(null));
              video.load();
            } else {
              fetch(url)
                .then((response) => resolve(response))
                .catch(() => resolve(null));
            }
          });
        });

        await Promise.all(loadPromises);
      } catch (error) {
        console.error('Error during asset preloading:', error);
      }
    };

    preloadAssets();
  }, []);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  const pct = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #060e1e 0%, #0d1a32 35%, #15264a 70%, #1e3660 100%)',
        overflow: 'hidden',
      }}
    >
      {/* ── Snowfall background ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {snowflakes.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              backgroundColor: '#fff',
              borderRadius: '50%',
              left: `${s.x}%`,
              top: '-4%',
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 1.5}px rgba(180,220,255,0.35)`,
              animation: `preloadSnow ${s.duration}s ${s.delay}s infinite linear`,
            }}
          />
        ))}
      </div>

      {/* ── Centered content card ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '36px 40px',
          background: 'rgba(8, 16, 38, 0.7)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(130, 200, 255, 0.18)',
          borderRadius: '18px',
          boxShadow: '0 8px 40px rgba(30, 80, 160, 0.25), inset 0 0 60px rgba(100, 180, 255, 0.04)',
          maxWidth: '90%',
        }}
      >
        {/* Snowflake crystal icon */}
        <div style={{ marginBottom: 18, animation: 'preloadRotate 8s linear infinite' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V22M12 2L9 5M12 2L15 5M12 22L9 19M12 22L15 19" stroke="url(#plGrad)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M4.93 4.93L19.07 19.07M4.93 4.93L5.5 8.5M4.93 4.93L8.5 5.5M19.07 19.07L18.5 15.5M19.07 19.07L15.5 18.5" stroke="url(#plGrad)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M4.93 19.07L19.07 4.93M4.93 19.07L8.5 18.5M4.93 19.07L5.5 15.5M19.07 4.93L15.5 5.5M19.07 4.93L18.5 8.5" stroke="url(#plGrad)" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.5" fill="url(#plGrad2)" opacity="0.7" />
            <defs>
              <linearGradient id="plGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a8dcff" />
                <stop offset="1" stopColor="#4a90cc" />
              </linearGradient>
              <linearGradient id="plGrad2" x1="9" y1="9" x2="15" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#dceeff" />
                <stop offset="1" stopColor="#5599cc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
            fontWeight: 800,
            color: '#a0d4ff',
            margin: '0 0 4px 0',
            letterSpacing: '5px',
            textShadow: '0 0 14px rgba(100,180,255,0.45)',
            fontFamily: '"Georgia", serif',
          }}
        >
          FROST GARDEN
        </h1>

        {/* Flavour text */}
        <p
          key={tipIdx}
          style={{
            fontSize: '0.8rem',
            color: 'rgba(140, 200, 255, 0.6)',
            margin: '0 0 22px 0',
            fontStyle: 'italic',
            letterSpacing: '1px',
            animation: 'preloadFadeIn 0.4s ease',
            minHeight: '1.2em',
          }}
        >
          {TIPS[tipIdx]}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: 'clamp(200px, 50vw, 280px)',
            height: 10,
            borderRadius: 6,
            background: 'rgba(60, 120, 200, 0.1)',
            border: '1px solid rgba(130, 200, 255, 0.2)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Shimmer layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(180,220,255,0.08) 50%, transparent 100%)',
              animation: 'preloadShimmer 2s ease-in-out infinite',
            }}
          />
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 6,
              background: `linear-gradient(90deg, #1a55aa ${0}%, #3399dd ${50}%, #66ccff ${100}%)`,
              boxShadow: pct > 5 ? '0 0 12px rgba(80,180,255,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Percentage */}
        <p
          style={{
            marginTop: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#7bb8e8',
            letterSpacing: '2px',
            fontFamily: "'Segoe UI', system-ui, monospace",
          }}
        >
          {pct}%
        </p>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes preloadSnow {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(108vh) translateX(${20}px) scale(0.6); opacity: 0; }
        }
        @keyframes preloadRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes preloadFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes preloadShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default PreloadScene;
