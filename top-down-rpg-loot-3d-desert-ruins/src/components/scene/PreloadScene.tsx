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
  'Unearthing ancient relics...',
  'Deciphering temple glyphs...',
  'Sifting through desert sands...',
  'Mapping forgotten ruins...',
  'Awakening the sun altar...',
  'Charting the dune trails...',
];

const PreloadScene: React.FC<PreloadSceneProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  /* Sand particle data (generated once) */
  const sandParticles = useRef(
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.35 + 0.1,
      drift: (Math.random() - 0.5) * 60,
    })),
  ).current;

  /* Cycle tips every 2.5s */
  useEffect(() => {
    const iv = setInterval(() => setTipIdx((p) => (p + 1) % TIPS.length), 2500);
    return () => clearInterval(iv);
  }, []);

  /* ── Asset preloading ── */
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
        background: 'linear-gradient(180deg, #1a0e05 0%, #2d1a0a 35%, #4a2a10 70%, #6b3d15 100%)',
        overflow: 'hidden',
      }}
    >
      {/* ── Sand drift background ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sandParticles.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              width: s.size,
              height: s.size,
              backgroundColor: '#e8c880',
              borderRadius: '50%',
              left: `${s.x}%`,
              top: '-4%',
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 1.5}px rgba(232,200,128,0.25)`,
              animation: `preloadSand ${s.duration}s ${s.delay}s infinite linear`,
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
          background: 'rgba(26, 14, 5, 0.75)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(232, 180, 80, 0.2)',
          borderRadius: '18px',
          boxShadow: '0 8px 40px rgba(60, 30, 10, 0.4), inset 0 0 60px rgba(232, 180, 80, 0.04)',
          maxWidth: '90%',
        }}
      >
        {/* Sun/compass icon */}
        <div style={{ marginBottom: 18, animation: 'preloadRotate 12s linear infinite' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" fill="url(#sunGrad)" opacity="0.8" />
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="url(#rayGrad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="url(#rayGrad)" strokeWidth="1.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="sunGrad" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffe0a0" />
                <stop offset="1" stopColor="#cc8830" />
              </linearGradient>
              <linearGradient id="rayGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e8c880" />
                <stop offset="1" stopColor="#aa7730" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
            fontWeight: 800,
            color: '#e8c880',
            margin: '0 0 4px 0',
            letterSpacing: '5px',
            textShadow: '0 0 14px rgba(232,180,80,0.45)',
            fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
          }}
        >
          DESERT RUINS
        </h1>

        {/* Flavour text */}
        <p
          key={tipIdx}
          style={{
            fontSize: '0.8rem',
            color: 'rgba(232, 200, 128, 0.6)',
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
            background: 'rgba(120, 80, 30, 0.15)',
            border: '1px solid rgba(232, 180, 80, 0.2)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Shimmer layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(232,200,128,0.08) 50%, transparent 100%)',
              animation: 'preloadShimmer 2s ease-in-out infinite',
            }}
          />
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 6,
              background: `linear-gradient(90deg, #8b5e1a ${0}%, #cc8830 ${50}%, #e8c060 ${100}%)`,
              boxShadow: pct > 5 ? '0 0 12px rgba(232,180,80,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
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
            color: '#c8a050',
            letterSpacing: '2px',
            fontFamily: "'Segoe UI', system-ui, monospace",
          }}
        >
          {pct}%
        </p>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes preloadSand {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          8%   { opacity: 0.6; }
          85%  { opacity: 0.3; }
          100% { transform: translateY(108vh) translateX(${40}px) scale(0.5); opacity: 0; }
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
