// Shared part — import it, don't rewrite it.
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../assets.json';
import { retarget, type AnimState } from '../game/anim';
import { fitModel } from '../game/fitModel';
import { loadGLTF } from './gltf';

// The template's shared mixamo clips (src/assets.json `animations`): any model on the
// mixamorig skeleton that ships without clips of its own can borrow them.
const SHARED = ['idle', 'walk', 'run'] as const;
const SHARED_URLS = SHARED.map((n) => assets.animations[`anims/${n}`].url);
const FADE = 0.15;

export type AnimatedModelOptions = {
  url: string;
  /** Height (m) the model is scaled to from its bounding box. */
  height: number;
  /** Read every update: plays the clip matching `state` (e.g. a navigator mover's `anim`). */
  source?: { state: AnimState };
};

/**
 * An animated character / creature model for enemies and NPCs (URL from
 * src/assets.json): feet at the origin, `height` m tall, facing its own +z.
 * Add `object3d` to the scene and move it; call `update(dt)` every frame.
 * `object3d` is empty until the GLB has loaded (`ready`).
 */
export function createAnimatedModel({ url, height, source }: AnimatedModelOptions) {
  const object3d = new THREE.Group();
  const fitted = new THREE.Group();
  object3d.add(fitted);

  let mixer: THREE.AnimationMixer | null = null;
  const actions = new Map<string, THREE.AnimationAction>();
  let names: string[] = [];
  let current = '';

  const ready = Promise.all([loadGLTF(url), ...SHARED_URLS.map(loadGLTF)]).then(([gltf, ...shared]) => {
    const scene = clone(gltf.scene); // skinned models need a real skeleton clone per instance
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    // Own clips win when they are named (idle / walk / run …). A mixamorig rig with no clips —
    // or only anonymous ones ("Armature|mixamo.com|Layer0") — borrows the template's idle / walk / run.
    let clips = gltf.animations;
    const named = clips.some((c) => /idle|walk|run/i.test(c.name));
    if (!named && scene.getObjectByName('mixamorigHips')) {
      clips = SHARED.map((name, i) => {
        const c = retarget(shared[i].animations[0], scene, shared[i].scene);
        c.name = name;
        return c;
      });
    }
    const { unit, lift } = fitModel(scene, { height });
    fitted.scale.setScalar(unit);
    fitted.position.y = lift;
    fitted.add(scene);
    mixer = new THREE.AnimationMixer(fitted);
    for (const c of clips) actions.set(c.name, mixer.clipAction(c, fitted));
    names = clips.map((c) => c.name);
  });
  ready.catch((e) => console.error(`animated model failed to load: ${url}`, e));

  return {
    object3d,
    ready,
    update(dt: number) {
      if (!mixer) return;
      // The clip whose name contains the state ("Walk", "walking", "Armature|walk"); run falls
      // back to walk, anything else to idle, a single-clip model just loops its clip.
      const want = source?.state ?? 'idle';
      const find = (k: string) => names.find((n) => n.toLowerCase().includes(k));
      const pick = find(want) ?? (want === 'run' ? find('walk') : undefined) ?? find('idle') ?? names[0];
      if (pick && pick !== current) {
        actions.get(pick)?.reset().fadeIn(FADE).play();
        actions.get(current)?.fadeOut(FADE);
        current = pick;
      }
      mixer.update(dt);
    },
  };
}
