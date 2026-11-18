// Shared by every R3F template — import it, don't rewrite it.
// A weapon / prop in a character's hand. Give it the model URL only: how to hold it (grip point,
// direction, real length) comes from the asset's info file `<url>.meta.json` (game/assetMeta.ts);
// without one it is estimated from the shape. `override` wins over both.
// Use it through `hold` on <Character> / <AnimatedModel>; it attaches to the drawn clone's hand bone.
// A model that fails to load, or a rig with no hand bone, warns once and draws no prop — the
// character and the game keep running.
import { Component, Suspense, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useAssetMeta } from '../../game/assetMeta';
import { holdInHand, warnOnce, type Side } from '../../game/hold';
import { gripFromMeta, gripProp, kindOf, resolveGrip, type GripKind, type GripOverride, type Resolved } from '../../game/grip';

/**
 * What a character holds: a model URL (from src/assets.json), which hand, and — only when the game
 * must change how it is held — `override` (`lengthM`, `kind`, or `point` + `forward` + `up` together)
 * or `kind` (used only when the asset has no grip).
 */
export type Hold = { url: string; side?: Side; override?: GripOverride; kind?: GripKind };

declare global {
  /** Debug: what each HeldProp attached, keyed by rig and side. */
  interface Window { __held?: Record<string, Resolved & { url: string; rig: string; frame: string; holder: THREE.Object3D }> }
}

const FAILED = { failed: true } as const;

/**
 * useGLTF, but a model that fails to load (404, network, bad file) comes back as null instead of
 * throwing: R3F reports even an error a boundary catches as an uncaught page error. The GLTF loader
 * instance is shared by every useGLTF call, so the error hook is set for the one load it starts and
 * removed at once.
 */
function useGLTFOrNull(url: string) {
  const gltf = useGLTF(url, true, true, (loader) => {
    const load = loader.load;
    loader.load = function (this: typeof loader, ...args: Parameters<typeof load>) {
      loader.load = load;
      const [u, onLoad, onProgress] = args;
      return load.call(this, u, onLoad, onProgress, (e: unknown) => {
        warnOnce(`hold: could not load ${url}, drawing no prop (${e instanceof Error ? e.message : String(e)})`);
        onLoad(FAILED as never);
      });
    } as typeof load;
  });
  return (gltf as unknown) === FAILED ? null : gltf;
}

/** Last resort: any other error in the prop drops the prop, not the character or the game. */
class Guard extends Component<{ url: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    warnOnce(`hold: could not put ${this.props.url} in the hand, drawing nothing instead (${error instanceof Error ? error.message : String(error)})`);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Render inside the model component, with `rig` = the clone that is drawn. Loads in its own Suspense. */
export function HeldProp(props: Hold & { rig: THREE.Object3D }) {
  return (
    <Guard key={props.url} url={props.url}>
      <Suspense fallback={null}>
        <Held {...props} />
      </Suspense>
    </Guard>
  );
}

function Held({ rig, url, side = 'Right', override, kind }: Hold & { rig: THREE.Object3D }) {
  const gltf = useGLTFOrNull(url);
  const meta = useAssetMeta(url);
  const sync = useRef<() => void>(() => {});
  // the override object is often written inline; compare it by value
  const overrideKey = JSON.stringify(override ?? null);
  useLayoutEffect(() => {
    if (!gltf) return;
    const attach = () => {
      const model = clone(gltf.scene);
      const res = resolveGrip(model, { grip: gripFromMeta(meta), override, kind: kind ?? kindOf(meta, url) });
      const prop = gripProp(model, res.grip);
      prop.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      const held = holdInHand(rig, prop, side);
      return held && { held, res };
    };
    let done: ReturnType<typeof attach> = null;
    try {
      done = attach();
    } catch (e) {
      warnOnce(`hold: could not put ${url} in the hand, drawing no prop (${e instanceof Error ? e.message : String(e)})`);
    }
    if (!done) return;
    const { held: h, res } = done;
    const key = `${rig.uuid.slice(0, 6)}:${side}`;
    (window.__held ??= {})[key] = { ...res, url, rig: h.rig, frame: h.from, holder: h.holder };
    sync.current = h.sync;
    return () => {
      h.holder.removeFromParent();
      sync.current = () => {};
      if (window.__held?.[key]?.holder === h.holder) delete window.__held[key];
    };
  }, [rig, gltf, meta, url, side, overrideKey, kind]); // override: by value, through overrideKey
  useFrame(() => sync.current());
  return null;
}
