import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../assets.json';
import { PLAYER } from '../config';
import { anim, retarget, type AnimState } from '../game/anim';
import { HeldProp, useBodyFollowsAim, usesRifleClips, type Hold } from './models/HeldProp';

const MODEL = assets.models['characters/base'].url;
const CLIP_URLS = {
  idle: assets.animations['anims/idle'].url,
  walk: assets.animations['anims/walk'].url,
  run: assets.animations['anims/run'].url,
  jump: assets.animations['anims/jump'].url,
};
/** Holding a gun: rifle idle / walk / run (no rifle jump in the library). */
const RIFLE_URLS: typeof CLIP_URLS = {
  ...CLIP_URLS,
  idle: assets.animations['anims/rifle-idle'].url,
  walk: assets.animations['anims/rifle-walk'].url,
  run: assets.animations['anims/rifle-run'].url,
};
type ClipName = keyof typeof CLIP_URLS;
const CLIP_NAMES = Object.keys(CLIP_URLS) as ClipName[];
/** Falling reuses the jump clip (held on its last frame). */
const CLIP_OF: Record<AnimState, ClipName> = { idle: 'idle', walk: 'walk', run: 'run', jump: 'jump', fall: 'jump' };
const FADE = 0.15;

/** Shown until the model has loaded. */
function Capsule() {
  const r = PLAYER.radius;
  return (
    <>
      <mesh position={[0, PLAYER.height / 2, 0]} castShadow>
        <capsuleGeometry args={[r, PLAYER.height - 2 * r, 6, 16]} />
        <meshStandardMaterial color="#4f8ef7" />
      </mesh>
      {/* visor marks the facing direction (+z) */}
      <mesh position={[0, PLAYER.height - 0.35, r - 0.02]}>
        <boxGeometry args={[0.4, 0.14, 0.12]} />
        <meshStandardMaterial color="#1b1b1b" />
      </mesh>
    </>
  );
}

function Model({ hold }: { hold?: Hold }) {
  const gltf = useGLTF(MODEL);
  const urls = usesRifleClips(hold) ? RIFLE_URLS : CLIP_URLS;
  const sources = useGLTF(CLIP_NAMES.map((n) => urls[n]));
  const { scene, clips } = useMemo(() => {
    const scene = clone(gltf.scene);
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const clips = CLIP_NAMES.map((name, i) => {
      const c = retarget(sources[i].animations[0], scene, sources[i].scene);
      c.name = name;
      return c;
    });
    return { scene, clips };
  }, [gltf, sources]);

  const group = useRef<THREE.Group>(null);
  useBodyFollowsAim(group, hold); // aiming a gun: the drawn body turns to the aim
  const { actions } = useAnimations(clips, group);
  const current = useRef<ClipName | null>(null);
  const jumps = useRef(anim.jumps);

  useEffect(() => {
    const jump = actions.jump;
    if (!jump) return;
    jump.setLoop(THREE.LoopOnce, 1);
    jump.clampWhenFinished = true;
  }, [actions]);

  // idle / walk / run / jump / fall, cross-faded.
  useFrame(() => {
    const name = CLIP_OF[anim.state];
    const tookOff = anim.jumps !== jumps.current;
    jumps.current = anim.jumps;
    if (name === current.current && !(tookOff && name === 'jump')) return;
    const next = actions[name];
    if (!next) return;
    const prev = current.current ? actions[current.current] : null;
    if (prev === next) next.reset().play();
    else {
      next.reset().fadeIn(FADE).play();
      prev?.fadeOut(FADE);
    }
    current.current = name;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
      {hold && <HeldProp rig={scene} {...hold} />}
    </group>
  );
}

/**
 * The verse8 base character (feet at the origin, facing +z); a capsule until it loads.
 * `hold` puts a weapon / tool in its hand (models/HeldProp); a gun switches to the rifle clips.
 */
export function Character({ hold }: { hold?: Hold } = {}) {
  return (
    <Suspense fallback={<Capsule />}>
      {/* other clips = a fresh mixer, so the playing-clip ref starts over */}
      <Model key={usesRifleClips(hold) ? 'rifle' : 'plain'} hold={hold} />
    </Suspense>
  );
}

useGLTF.preload(MODEL);
