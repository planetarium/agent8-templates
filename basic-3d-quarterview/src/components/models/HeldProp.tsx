// Shared by every R3F template — import it, don't rewrite it.
// A weapon / tool in a character's hand. <Character> and <AnimatedModel> render it for their
// `hold` prop on the clone they draw; games don't render it directly.
import { Component, Suspense, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAssetMeta, type AssetMeta } from '../../game/assetMeta';
import { gripFromMeta, gripMatrix, kindOf, resolveGrip, sceneVertices, type GripKind, type GripOverride } from '../../game/grip';
import { followAim, holdInHand, yawOf, type Aim, type Muzzle, type Side } from '../../game/hold';

export type { Aim, Muzzle } from '../../game/hold';
export { useAssetMetaWhenRead } from '../../game/assetMeta';

export type Hold = {
  /** Weapon GLB URL (src/assets.json). How it is held comes from the asset's info file (`<url>.meta.json`) by this URL. */
  url: string;
  /** Hand that holds it (default Right). A gun's barrel lies toward the other hand. */
  side?: Side;
  /**
   * Grip values that win over the info file / estimate: `kind`, `lengthM`, `muzzleTip` one by
   * one (e.g. `{ lengthM: 0.9 }`); `point`, `forward`, `up` only all three together.
   */
  override?: GripOverride;
  /** Kind when the info file has no grip and its tags / file name do not tell (gun / blade / hafted / polearm / bow). */
  kind?: GripKind;
  /**
   * Gun only: where it points. World yaw (0 = +z, atan2(dx, dz)), pitch (up +), weight 0–1; mutate
   * it per frame. The drawn body turns to the aim yaw by the weight; the barrel stays within 60° of
   * the body either way.
   */
  aim?: Aim;
  /** Gun only: filled every frame with the muzzle's world position / direction — start shots here. */
  muzzle?: Muzzle;
  /** Rifle idle / walk / run clips while holding a gun (default true for guns). */
  rifleClips?: boolean;
};

/** A muzzle object to pass as `hold.muzzle` (read `.valid` before using it). */
export const newMuzzle = (): Muzzle => ({ x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 1, valid: false });

/** The kind a hold is held as: override > info file grip > `hold.kind` > info file tags / file name. */
export function holdKind(hold: Hold, meta: AssetMeta | null): GripKind {
  return hold.override?.kind ?? gripFromMeta(meta)?.kind ?? hold.kind ?? kindOf(meta, hold.url);
}

/**
 * Whether this hold plays the rifle clips: a gun, unless `rifleClips: false`. `meta` = the
 * weapon's info file (`useAssetMetaWhenRead(hold?.url)`; null until it arrives).
 */
export function usesRifleClips(hold: Hold | undefined, meta: AssetMeta | null) {
  if (!hold || hold.rifleClips === false) return false;
  return holdKind(hold, meta) === 'gun';
}

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

/**
 * A character aiming a gun faces the aim: turns `group` (the drawn model, under the body the
 * movement code rotates) toward `hold.aim.yaw` by its weight, and back when the aim drops. The
 * movement code's facing is left alone. No gun or no aim: the group stays at 0.
 */
export function useBodyFollowsAim(group: RefObject<THREE.Group | null>, hold: Hold | undefined, meta: AssetMeta | null) {
  const gun = !!hold && holdKind(hold, meta) === 'gun';
  const aim = useRef(hold?.aim);
  aim.current = gun ? hold?.aim : undefined;
  useFrame((_, delta) => {
    const g = group.current;
    if (!g || (!aim.current && g.rotation.y === 0)) return;
    let parentYaw = 0;
    if (g.parent) {
      g.parent.getWorldQuaternion(_q);
      _v.set(0, 0, 1).applyQuaternion(_q);
      parentYaw = yawOf(_v.x, _v.z);
    }
    const y = followAim(g.rotation.y, parentYaw, aim.current, Math.min(delta, 0.1));
    g.rotation.y = Math.abs(y) < 1e-4 && !aim.current ? 0 : y;
  });
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

type Internal = { rig: THREE.Object3D; aimByBody?: boolean };

function Prop({ rig, url, side, override, kind, aim, muzzle, aimByBody }: Hold & Internal) {
  const gltf = useGLTF(url);
  // the info file (<url>.meta.json): suspends like useGLTF; null = none (404, other host, timeout)
  const meta = useAssetMeta(url);
  // aim / muzzle are read while drawing: keep the latest without re-attaching
  const live = useRef({ aim, muzzle, aimByBody });
  live.current = { aim, muzzle, aimByBody };
  const overrideKey = JSON.stringify(override ?? null);
  useLayoutEffect(() => {
    const model = gltf.scene.clone(true);
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const pos = sceneVertices(model);
    const res = resolveGrip(pos, { grip: gripFromMeta(meta), override: JSON.parse(overrideKey) ?? undefined, kind: kind ?? kindOf(meta, url) });
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
      aimByBody: () => !!live.current.aimByBody,
    });
    held.holder.userData.held = { url, kind: res.grip.kind, source: res.source, lengthM: res.grip.lengthM, muzzleTip: !!res.grip.muzzleTip, fit: held.fit };
    return held.dispose;
  }, [rig, gltf, meta, url, side, overrideKey, kind]);
  return null;
}

/** Render inside the model component, with `rig` = the clone that is drawn. */
export function HeldProp(props: Hold & Internal) {
  return (
    <HoldBoundary key={props.url}>
      <Suspense fallback={null}>
        <Prop {...props} />
      </Suspense>
    </HoldBoundary>
  );
}
