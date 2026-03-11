import React, { useEffect, useState } from 'react';
import assets from '../../assets.json';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three-stdlib';
import { TextureLoader } from 'three';

interface PreloadSceneProps {
  onComplete: () => void;
}

type AssetCategory = Record<string, { url: string; [key: string]: unknown }>;
type LoadedAsset = GLTF | THREE.Texture | HTMLAudioElement | HTMLVideoElement | Response | null;

const PreloadScene: React.FC<PreloadSceneProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

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

        const loadingManager = new THREE.LoadingManager();
        loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
          setProgress(Math.floor((itemsLoaded / itemsTotal) * 100));
        };
        loadingManager.onLoad = () => {
          setProgress(100);
          setIsComplete(true);
        };
        loadingManager.onError = (url) => console.error(`Loading error: ${url}`);

        const loadPromises = allUrls.map((url) => {
          const ext = url.split('.').pop()?.toLowerCase();
          return new Promise<LoadedAsset>((resolve) => {
            if (ext === 'glb' || ext === 'gltf') {
              const loader = new GLTFLoader(loadingManager);
              loader.load(url, (gltf) => resolve(gltf), undefined, () => resolve(null));
            } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
              const loader = new TextureLoader(loadingManager);
              loader.load(url, (texture) => resolve(texture), undefined, () => resolve(null));
            } else {
              fetch(url).then((r) => resolve(r)).catch(() => resolve(null));
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
        background: 'linear-gradient(135deg, #0a0014 0%, #1a0030 50%, #0a0014 100%)',
        color: '#ff00ff',
        fontFamily: "'Orbitron', system-ui, sans-serif",
      }}
    >
      {/* Scan line overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />
      <h2
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '24px',
          letterSpacing: '6px',
          textShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff60',
        }}
      >
        INITIALIZING
      </h2>
      <div
        style={{
          width: '280px',
          height: '4px',
          background: 'rgba(255, 0, 255, 0.1)',
          border: '1px solid rgba(255, 0, 255, 0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
            boxShadow: '0 0 10px #ff00ff, 0 0 20px #00ffff60',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p
        style={{
          marginTop: '12px',
          fontSize: '0.8rem',
          color: '#00ffff',
          letterSpacing: '3px',
          textShadow: '0 0 8px #00ffff60',
        }}
      >
        {progress}%
      </p>
    </div>
  );
};

export default PreloadScene;
