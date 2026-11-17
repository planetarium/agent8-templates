// Shared by every R3F template — import it, don't rewrite it.
// A weapon / tool in a character's hand. <Character> and <AnimatedModel> render it for their
// `hold` prop on the clone they draw; games don't render it directly.
import { Component, Suspense, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { gripMatrix, kindOf, resolveGrip, sceneVertices, type Grip, type GripKind } from '../../game/grip';
import { holdInHand, type Aim, type Muzzle, type Side } from '../../game/hold';

export type { Aim, Muzzle } from '../../game/hold';

export type Hold = {
  /** Weapon GLB URL (src/assets.json). Its grip comes from the library table by this URL. */
  url: string;
  /** Hand that holds it (default Right). A gun's barrel lies toward the other hand. */
  side?: Side;
  /** Grip fields that win over the library value / estimate (e.g. `{ lengthM: 0.9 }`). */
  override?: Partial<Grip>;
  /** Kind when the URL is not in the table and its name does not tell (gun / blade / hafted / polearm). */
  kind?: GripKind;
  /** Gun only: where it points. World yaw (0 = +z), pitch (up +), weight 0–1. Mutate it per frame. */
  aim?: Aim;
  /** Gun only: filled every frame with the muzzle's world position / direction — start shots here. */
  muzzle?: Muzzle;
  /** Rifle idle / walk / run clips while holding a gun (default true for guns). */
  rifleClips?: boolean;
};

/** A muzzle object to pass as `hold.muzzle` (read `.valid` before using it). */
export const newMuzzle = (): Muzzle => ({ x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 1, valid: false });

/** Whether this hold plays the rifle clips: a gun, unless `rifleClips: false`. */
export function usesRifleClips(hold?: Hold) {
  if (!hold || hold.rifleClips === false) return false;
  return (hold.override?.kind ?? hold.kind ?? kindOf(hold.url)) === 'gun';
}

/** A weapon that fails to load or attach is left out; the character and the game go on. */
class HoldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('held weapon left out', error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Prop({ rig, url, side, override, kind, aim, muzzle }: Hold & { rig: THREE.Object3D }) {
  const gltf = useGLTF(url);
  // aim / muzzle are read while drawing: keep the latest without re-attaching
  const live = useRef({ aim, muzzle });
  live.current = { aim, muzzle };
  const overrideKey = JSON.stringify(override ?? null);
  useLayoutEffect(() => {
    const model = gltf.scene.clone(true);
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const pos = sceneVertices(model);
    const res = resolveGrip(pos, { url, override: JSON.parse(overrideKey) ?? undefined, kind });
    const { matrix, tip } = gripMatrix(pos, res.grip);
    const prop = new THREE.Group();
    prop.name = 'held-prop';
    prop.matrixAutoUpdate = false;
    prop.matrix.copy(matrix);
    prop.add(model);
    const held = holdInHand(rig, prop, {
      kind: res.grip.kind,
      side,
      tip,
      get aim() {
        return live.current.aim;
      },
      get muzzle() {
        return live.current.muzzle;
      },
    });
    held.holder.userData.held = { url, kind: res.grip.kind, source: res.source, lengthM: res.grip.lengthM, fit: held.fit };
    return held.dispose;
  }, [rig, gltf, url, side, overrideKey, kind]);
  return null;
}

/** Render inside the model component, with `rig` = the clone that is drawn. */
export function HeldProp(props: Hold & { rig: THREE.Object3D }) {
  return (
    <HoldBoundary key={props.url}>
      <Suspense fallback={null}>
        <Prop {...props} />
      </Suspense>
    </HoldBoundary>
  );
}
