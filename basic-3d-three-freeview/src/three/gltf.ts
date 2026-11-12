// Shared part — import it, don't rewrite it.
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();

/**
 * Load a GLB once per URL (later calls get the same promise). The result is
 * shared: clone `gltf.scene` before putting it in the scene more than once
 * (SkeletonUtils `clone` for skinned models).
 */
export function loadGLTF(url: string): Promise<GLTF> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url);
    p.catch(() => cache.delete(url)); // a failed load can be retried
    cache.set(url, p);
  }
  return p;
}

/** Start fetching a GLB before it is needed (e.g. the player model at module load). */
export function preloadGLTF(url: string) {
  void loadGLTF(url).catch(() => {});
}
