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
          const currentProgress = Math.floor((itemsLoaded / itemsTotal) * 100);
          setProgress(currentProgress);
        };

        loadingManager.onLoad = () => {
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
    if (isComplete) {
      onComplete();
    }
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
        background: 'linear-gradient(180deg, #0d1f0d 0%, #1a2e1a 50%, #0a1a0a 100%)',
        color: '#c4a265',
        fontFamily: "'Philosopher', serif",
      }}
    >
      {/* Soft light rays overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(196,162,101,0.06) 0%, transparent 60%)',
        }}
      />

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          letterSpacing: '8px',
          textShadow: '0 0 20px rgba(196,162,101,0.5), 0 0 40px rgba(107,143,78,0.3)',
          fontFamily: "'Cinzel', serif",
        }}
      >
        AWAKENING
      </h2>

      <div
        style={{
          width: '280px',
          height: '4px',
          background: 'rgba(196, 162, 101, 0.1)',
          border: '1px solid rgba(196, 162, 101, 0.25)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: 'linear-gradient(90deg, #6b8f4e, #c4a265)',
            boxShadow: '0 0 10px rgba(107,143,78,0.5), 0 0 20px rgba(196,162,101,0.3)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <p
        style={{
          marginTop: '12px',
          color: '#6b8f4e',
          fontSize: '12px',
          letterSpacing: '3px',
          textShadow: '0 0 8px rgba(107,143,78,0.4)',
          fontFamily: "'Cinzel', serif",
        }}
      >
        {progress}% ~ gathering spirits...
      </p>
    </div>
  );
};

export default PreloadScene;
