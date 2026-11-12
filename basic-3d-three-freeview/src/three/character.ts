import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../assets.json';
import { PLAYER } from '../config';
import { anim, retarget, type AnimState } from '../game/anim';
import { loadGLTF, preloadGLTF } from './gltf';

const MODEL = assets.models['characters/base'].url;
const CLIP_URLS = {
  idle: assets.animations['anims/idle'].url,
  walk: assets.animations['anims/walk'].url,
  run: assets.animations['anims/run'].url,
  jump: assets.animations['anims/jump'].url,
};
type ClipName = keyof typeof CLIP_URLS;
const CLIP_NAMES = Object.keys(CLIP_URLS) as ClipName[];
/** Falling reuses the jump clip (held on its last frame). */
const CLIP_OF: Record<AnimState, ClipName> = { idle: 'idle', walk: 'walk', run: 'run', jump: 'jump', fall: 'jump' };
const FADE = 0.15;

preloadGLTF(MODEL);

/** Shown until the model has loaded. */
function capsule() {
  const r = PLAYER.radius;
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(r, PLAYER.height - 2 * r, 6, 16),
    new THREE.MeshStandardMaterial({ color: '#4f8ef7' }),
  );
  body.position.y = PLAYER.height / 2;
  body.castShadow = true;
  // visor marks the facing direction (+z)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.12), new THREE.MeshStandardMaterial({ color: '#1b1b1b' }));
  visor.position.set(0, PLAYER.height - 0.35, r - 0.02);
  g.add(body, visor);
  return g;
}

/**
 * The verse8 base character (feet at the origin, facing +z); a capsule until
 * it loads. `update(dt)` plays idle / walk / run / jump / fall from `anim`, cross-faded.
 */
export function createCharacter() {
  const object3d = new THREE.Group();
  const placeholder = capsule();
  object3d.add(placeholder);

  let mixer: THREE.AnimationMixer | null = null;
  const actions = {} as Record<ClipName, THREE.AnimationAction>;
  let current: ClipName | null = null;
  let jumps = anim.jumps;

  Promise.all([loadGLTF(MODEL), ...CLIP_NAMES.map((n) => loadGLTF(CLIP_URLS[n]))])
    .then(([gltf, ...sources]) => {
      const scene = clone(gltf.scene);
      scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      mixer = new THREE.AnimationMixer(object3d);
      CLIP_NAMES.forEach((name, i) => {
        const c = retarget(sources[i].animations[0], scene, sources[i].scene);
        c.name = name;
        actions[name] = mixer!.clipAction(c, object3d);
      });
      actions.jump.setLoop(THREE.LoopOnce, 1);
      actions.jump.clampWhenFinished = true;
      object3d.remove(placeholder);
      object3d.add(scene);
    })
    .catch((e) => console.error('character failed to load', e));

  return {
    object3d,
    update(dt: number) {
      if (!mixer) return;
      const name = CLIP_OF[anim.state];
      const tookOff = anim.jumps !== jumps;
      jumps = anim.jumps;
      if (name !== current || (tookOff && name === 'jump')) {
        const next = actions[name];
        const prev = current ? actions[current] : null;
        if (prev === next) next.reset().play();
        else {
          next.reset().fadeIn(FADE).play();
          prev?.fadeOut(FADE);
        }
        current = name;
      }
      mixer.update(dt);
    },
  };
}
