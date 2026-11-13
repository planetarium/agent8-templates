// Shared by every R3F template — import it, don't rewrite it.
import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../../assets.json';
import { retarget, type AnimState } from '../../game/anim';
import { fitModel } from '../../game/fitModel';
import { clipGroundOffsets } from '../../game/groundClips';

// The template's shared mixamo clips (src/assets.json `animations`): any model on the
// mixamorig skeleton that ships without clips of its own can borrow them.
const SHARED = ['idle', 'walk', 'run'] as const;
const SHARED_URLS = SHARED.map((n) => assets.animations[`anims/${n}`].url);
const FADE = 0.15;
const STATES: AnimState[] = ['idle', 'walk', 'run', 'jump', 'fall'];
/** Ground offsets per model URL (model units, so every copy of a model shares them): sampled once. */
const GROUND = new Map<string, Record<string, number>>();

/**
 * The clip a state plays: the one whose name contains the state ("Walk", "walking",
 * "Armature|walk"); run falls back to walk, anything else to idle, a single-clip model
 * just loops its clip.
 */
function pickClip(names: string[], want: AnimState) {
  const find = (k: string) => names.find((n) => n.toLowerCase().includes(k));
  return find(want) ?? (want === 'run' ? find('walk') : undefined) ?? find('idle') ?? names[0];
}

function Model({ url, height, source }: { url: string; height: number; source?: { state: AnimState } }) {
  const gltf = useGLTF(url);
  const shared = useGLTF(SHARED_URLS);
  const { scene, clips, unit, lift, ground } = useMemo(() => {
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
    // fitModel sizes the model (unit) and stands its bind pose on y = 0 (lift). A clip can sit
    // lower or higher than the bind pose (a borrowed clip straightens bent legs), so each clip
    // this model can play is posed off screen once (per URL) and gets its own ground offset.
    const fit = fitModel(scene, { height });
    let ground = GROUND.get(url);
    if (!ground) {
      const names = clips.map((c) => c.name);
      const playable = new Set(STATES.map((s) => pickClip(names, s)));
      ground = clipGroundOffsets(scene, clips.filter((c) => playable.has(c.name)));
      GROUND.set(url, ground);
    }
    return { scene, clips, ...fit, ground };
  }, [url, gltf, shared, height]);

  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(clips, group);
  const current = useRef('');
  // lift eases from the old clip's ground offset to the new one's over the cross-fade
  const ease = useRef({ from: lift, to: lift, t: FADE });
  useFrame((_, delta) => {
    const pick = pickClip(names, source?.state ?? 'idle');
    if (pick && pick !== current.current) {
      actions[pick]?.reset().fadeIn(FADE).play();
      actions[current.current]?.fadeOut(FADE);
      const to = ground[pick] !== undefined ? ground[pick] * unit : lift;
      ease.current = current.current ? { from: group.current?.position.y ?? to, to, t: 0 } : { from: to, to, t: FADE };
      current.current = pick;
    }
    const e = ease.current;
    e.t = Math.min(FADE, e.t + delta);
    const k = e.t / FADE;
    if (group.current) group.current.position.y = e.from + (e.to - e.from) * k * k * (3 - 2 * k);
  });

  return (
    <group ref={group} scale={unit} position-y={lift}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * An animated character / creature model for enemies and NPCs (URL from src/assets.json):
 * feet at the origin, `height` m tall, facing its own +z. Plays the clip matching
 * `source.state` (idle / walk / run — e.g. a navigator mover's `anim`).
 */
export function AnimatedModel({
  url,
  height,
  source,
  fallback = null,
}: {
  url: string;
  height: number;
  source?: { state: AnimState };
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <Model url={url} height={height} source={source} />
    </Suspense>
  );
}
