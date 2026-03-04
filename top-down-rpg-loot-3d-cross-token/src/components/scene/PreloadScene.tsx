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

/**
 * PreloadScene — loads all assets from assets.json before the game starts.
 * [CHANGE] Update the loading screen title/theme to match your concept.
 */
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
        loadingManager.onError = (url) => {
          console.error(`Loading error: ${url}`);
        };

        const loadPromises = allUrls.map((url) => {
          const ext = url.split('.').pop()?.toLowerCase();
          return new Promise<LoadedAsset>((resolve) => {
            if (ext === 'glb' || ext === 'gltf') {
              const loader = new GLTFLoader(loadingManager);
              loader.load(url, (gltf) => resolve(gltf), undefined, () => resolve(null));
            } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
              const loader = new TextureLoader(loadingManager);
              loader.load(url, (tex) => resolve(tex), undefined, () => resolve(null));
            } else {
              fetch(url).then((r) => resolve(r)).catch(() => resolve(null));
            }
          });
        });

        await Promise.all(loadPromises);
      } catch (error) {
        console.error('Error during asset preloading:', error);
        setIsComplete(true);
      }
    };
    preloadAssets();
  }, []);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 100%)' }}
    >
      {/* Title */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#b07aff', margin: 0, letterSpacing: '0.1em' }}>
          ◆ CRYSTAL DUNGEON
        </h1>
        <p style={{ color: '#7755aa', marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading dungeon...</p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '280px', height: '8px', background: '#2a1a4a', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: 'linear-gradient(90deg, #7744cc, #b07aff)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ color: '#9966dd', marginTop: '0.75rem', fontSize: '0.85rem' }}>{progress}%</p>
    </div>
  );
};

export default PreloadScene;
