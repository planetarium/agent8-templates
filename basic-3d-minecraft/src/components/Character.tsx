import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../assets.json';
import { PLAYER } from '../config';
import { anim, retarget, type AnimState } from '../game/anim';
import { aimSpine, findSpine, splitClip, stepLegs, type LegState } from '../game/aimRig';
import { findHand, yawOf } from '../game/hold';
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
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

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
  const aiming = usesRifleClips(hold) && !!hold?.aim;
  const { scene, clips, split } = useMemo(() => {
    const scene = clone(gltf.scene);
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const full = CLIP_NAMES.map((name, i) => {
      const c = retarget(sources[i].animations[0], scene, sources[i].scene);
      c.name = name;
      return c;
    });
    // aiming a gun on a rig with a spine: legs and upper body play separately (game/aimRig.ts)
    const split = aiming ? findSpine(scene) : null;
    const clips = split ? full.flatMap((c) => Object.values(splitClip(c, split))) : full;
    return { scene, clips, split };
  }, [gltf, sources, aiming]);

  const group = useRef<THREE.Group>(null);
  // aiming a gun without a split body: the whole drawn body turns to the aim
  useBodyFollowsAim(group, split ? undefined : hold);
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

  // Split body (after the mixer has posed the rig): the legs walk where the character moves —
  // backwards when the aim is behind — and the upper body holds the rifle pose turned onto the aim.
  const legs = useRef<LegState | null>(null);
  const upper = useRef<string | null>(null);
  const spineState = useRef({ base: [] as THREE.Quaternion[], set: [] as THREE.Quaternion[], corrYaw: 0, corrPitch: 0 });
  const hands = useMemo(() => {
    const grip = findHand(scene, 'Right');
    return grip ? { grip, support: findHand(scene, 'Left') } : null;
  }, [scene]);
  const failed = useRef(false);
  useFrame((_, delta) => {
    const g = group.current;
    const aim = hold?.aim;
    if (!split || !g || !aim || failed.current) return;
    try {
      aimFrame(g, aim, delta);
    } catch (e) {
      failed.current = true; // keep the game running: legs and arms just play the clips
      console.warn('split-body aiming stopped', e);
    }
  });
  function aimFrame(g: THREE.Group, aim: NonNullable<Hold['aim']>, delta: number) {
    const moving = anim.state === 'walk' || anim.state === 'run';
    const up = `${moving ? anim.state : 'idle'}:up`;
    if (up !== upper.current) {
      actions[up]?.reset().fadeIn(FADE).play();
      if (upper.current) actions[upper.current]?.fadeOut(FADE);
      upper.current = up;
    }
    g.parent?.getWorldQuaternion(_q);
    _v.set(0, 0, 1).applyQuaternion(_q);
    const moveYaw = yawOf(_v.x, _v.z); // the movement code turns the parent to the walking direction
    const aimYaw = aim.weight > 0 ? aim.yaw : moveYaw;
    legs.current = stepLegs(legs.current ?? { yaw: moveYaw, reversed: false, turning: false }, aimYaw, moveYaw, moving, Math.min(delta, 0.1));
    g.rotation.y = Math.atan2(Math.sin(legs.current.yaw - moveYaw), Math.cos(legs.current.yaw - moveYaw));
    const lower = actions[CLIP_OF[anim.state]];
    if (lower) lower.timeScale = moving && legs.current.reversed ? -1 : 1;
    if (hands && aim.weight > 0) aimSpine(split!, hands, { yaw: aim.yaw, pitch: aim.pitch }, legs.current.yaw, spineState.current);
  }

  return (
    <group ref={group}>
      <primitive object={scene} />
      {hold && <HeldProp rig={scene} {...hold} aimByBody={!!split} />}
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
      <Model key={`${usesRifleClips(hold) ? 'rifle' : 'plain'}|${!!hold?.aim}`} hold={hold} />
    </Suspense>
  );
}

useGLTF.preload(MODEL);
