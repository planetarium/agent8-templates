import React, { useEffect, useState } from 'react';
import assets from '../../assets.json';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three-stdlib';
import { TextureLoader } from 'three';

interface PreloadSceneProps {
  onComplete: () => void;
}

// Type definition to accept any structure in assets.json
type AssetCategory = Record<string, { url: string; [key: string]: unknown }>;

// Type for the different possible loaded asset types
type LoadedAsset = GLTF | THREE.Texture | HTMLAudioElement | HTMLVideoElement | Response | null;

/**
 * Asset Preloading Scene Component
 *
 * Preloads all assets defined in assets.json regardless of type
 * (models, animations, textures, etc.) and calls the onComplete callback when loading is finished.
 */
const PreloadScene: React.FC<PreloadSceneProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Collect all asset URLs from every category in assets.json
        const allUrls: string[] = [];

        // Get all categories from assets.json (characters, animations, textures, etc.)
        const categories = Object.keys(assets);

        // Loop through each category and collect URLs
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

        // Setup loading manager for all assets
        const loadingManager = new THREE.LoadingManager();

        // Set up loading manager event handlers
        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
          const currentProgress = Math.floor((itemsLoaded / itemsTotal) * 100);
          console.log(`Loading progress: ${currentProgress}% (${url})`);
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

        // Create a Promise for each asset to load with appropriate loader
        const loadPromises = allUrls.map((url) => {
          // Determine file type from extension
          const fileExtension = url.split('.').pop()?.toLowerCase();

          return new Promise<LoadedAsset>((resolve) => {
            // Choose appropriate loader based on file extension
            if (fileExtension === 'glb' || fileExtension === 'gltf') {
              // Use GLTFLoader for 3D models and animations
              const loader = new GLTFLoader(loadingManager);
              loader.load(
                url,
                (gltf) => {
                  console.log(`Loaded model: ${url}`);
                  resolve(gltf);
                },
                undefined,
                (error) => {
                  console.error(`Failed to load model: ${url}`, error);
                  resolve(null);
                },
              );
            } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
              // Use TextureLoader for image textures
              const loader = new TextureLoader(loadingManager);
              loader.load(
                url,
                (texture) => {
                  console.log(`Loaded texture: ${url}`);
                  resolve(texture);
                },
                undefined,
                (error) => {
                  console.error(`Failed to load texture: ${url}`, error);
                  resolve(null);
                },
              );
            } else if (['mp3', 'wav', 'ogg'].includes(fileExtension || '')) {
              // For audio files, preload with audio element
              const audio = new Audio();
              audio.src = url;

              audio.addEventListener('canplaythrough', () => {
                console.log(`Loaded audio: ${url}`);
                resolve(audio);
              });

              audio.addEventListener('error', () => {
                console.error(`Failed to load audio: ${url}`);
                resolve(null);
              });

              // Force preloading
              audio.load();
            } else if (['mp4', 'webm'].includes(fileExtension || '')) {
              // For video files
              const video = document.createElement('video');
              video.src = url;
              video.preload = 'auto';

              video.addEventListener('canplaythrough', () => {
                console.log(`Loaded video: ${url}`);
                resolve(video);
              });

              video.addEventListener('error', () => {
                console.error(`Failed to load video: ${url}`);
                resolve(null);
              });

              // Force preloading
              video.load();
            } else {
              // For other file types, use a simple fetch to ensure it's in browser cache
              fetch(url)
                .then((response) => {
                  if (!response.ok) throw new Error(`Failed to load: ${url}`);
                  console.log(`Loaded other: ${url}`);
                  return resolve(response);
                })
                .catch((error) => {
                  console.error(`Failed to load: ${url}`, error);
                  resolve(null);
                });
            }
          });
        });

        // Wait for all loading tasks to complete
        await Promise.all(loadPromises);
      } catch (error) {
        console.error('Error during asset preloading:', error);
      }
    };

    preloadAssets();
  }, []);

  // Call onComplete callback when loading is finished
  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <h2 className="text-2xl font-bold mb-4">Loading</h2>
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
      <p className="mt-2">{progress}%</p>
    </div>
  );
};

export default PreloadScene;
