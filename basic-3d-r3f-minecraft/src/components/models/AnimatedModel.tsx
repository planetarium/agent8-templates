// Shared by every R3F template — import it, don't rewrite it.
import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import assets from '../../assets.json';
import { retarget, type AnimState } from '../../game/anim';
import { fitModel } from '../../game/fitModel';

// The template's shared mixamo clips (src/assets.json `animations`): any model on the
// mixamorig skeleton that ships without clips of its own can borrow them.
const SHARED = ['idle', 'walk', 'run'] as const;
const SHARED_URLS = SHARED.map((n) => assets.animations[`anims/${n}`].url);
const FADE = 0.15;

function Model({ url, height, source }: { url: string; height: number; source?: { state: AnimState } }) {
  const gltf = useGLTF(url);
  const shared = useGLTF(SHARED_URLS);
  const { scene, clips, unit, lift } = useMemo(() => {
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
    return { scene, clips, ...fitModel(scene, { height }) };
  }, [gltf, shared, height]);

  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(clips, group);
  const current = useRef('');
  useFrame(() => {
    // The clip whose name contains the state ("Walk", "walking", "Armature|walk"); run falls
    // back to walk, anything else to idle, a single-clip model just loops its clip.
    const want = source?.state ?? 'idle';
    const find = (k: string) => names.find((n) => n.toLowerCase().includes(k));
    const pick = find(want) ?? (want === 'run' ? find('walk') : undefined) ?? find('idle') ?? names[0];
    if (!pick || pick === current.current) return;
    actions[pick]?.reset().fadeIn(FADE).play();
    actions[current.current]?.fadeOut(FADE);
    current.current = pick;
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
