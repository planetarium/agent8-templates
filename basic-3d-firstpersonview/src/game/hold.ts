// Put a prop in a character's hand: the grip frame of a hand bone, and parenting with the bone's
// world scale cancelled. Used by components/models/HeldProp.tsx — call that, not this.
// Rigs: mixamo (mixamorigRightHand, mixamorigRightHandIndex1 …) and claythis (Hand_R, Index1_R …).
// Library rigs are often reduced: of 323 mixamo characters only 75 have index + middle + ring /
// pinky finger roots; most have one index chain (a mitten finger along the hand), some only the
// hand bone (hold.fixture.json). Those get a frame from the hand bone's own axes.
import * as THREE from 'three';

export type Side = 'Right' | 'Left';
export type Rig = 'mixamo' | 'claythis';
type Finger = 'index' | 'middle' | 'ring' | 'pinky' | 'thumb';

/** Bone names per rig. */
const NAMES: Record<Rig, (side: Side) => Record<'hand' | Finger, string[]>> = {
  // GLTFLoader strips the ':' of "mixamorig:RightHand"; keep both spellings
  mixamo: (s) => {
    const m = (n: string) => [`mixamorig${s}${n}`, `mixamorig:${s}${n}`];
    return { hand: m('Hand'), index: m('HandIndex1'), middle: m('HandMiddle1'), ring: m('HandRing1'), pinky: m('HandPinky1'), thumb: m('HandThumb1') };
  },
  claythis: (s) => {
    const k = s === 'Right' ? 'R' : 'L';
    return { hand: [`Hand_${k}`], index: [`Index1_${k}`], middle: [`Middle1_${k}`], ring: [`Ring1_${k}`], pinky: [`Little1_${k}`], thumb: [`Thumb1_${k}`] };
  },
};

const byName = (root: THREE.Object3D, names: string[]) => {
  for (const n of names) {
    const o = root.getObjectByName(n);
    if (o) return o;
  }
  return undefined;
};

export type HandBones = { rig: Rig; hand: THREE.Object3D } & Partial<Record<Finger, THREE.Object3D>>;

/** The hand bone of a rig and whichever finger roots it has; undefined when it has no hand bone. */
export function handBones(root: THREE.Object3D, side: Side = 'Right'): HandBones | undefined {
  for (const rig of ['mixamo', 'claythis'] as Rig[]) {
    const n = NAMES[rig](side);
    const hand = byName(root, n.hand);
    if (!hand) continue;
    // finger roots are searched under the hand (direct children on both rigs, but don't rely on it)
    const b: HandBones = { rig, hand };
    for (const f of ['index', 'middle', 'ring', 'pinky', 'thumb'] as Finger[]) b[f] = byName(hand, n[f]);
    return b;
  }
  return undefined;
}

/** Position of a descendant in the hand's local space (equals `.position` for a direct child). */
function inHand(hand: THREE.Object3D, o: THREE.Object3D) {
  if (o.parent === hand) return o.position.clone();
  hand.updateWorldMatrix(true, true);
  return hand.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
}

/** Hand length over forearm length (wrist → middle knuckle / elbow → wrist), median of the 75 full library rigs. */
const HAND_PER_FOREARM = 0.55;

export type GripFrame = { matrix: THREE.Matrix4; from: 'fingers' | 'hand' };

/**
 * The grip frame of a hand, in the hand bone's local space:
 * - origin: the fist centre — 70 % of the way from the wrist to the knuckles, `palm` × hand length out of the palm
 * - +X "forward": wrist → knuckles (where a pointed index finger points)
 * - +Y "up": along the knuckle line, pinky → index (the top of the fist)
 * - +Z: X × Y
 * `fingers`: index + a second finger root (pinky, ring or middle) give the knuckle line; the thumb
 * picks the palm side. `hand` (reduced rig): the mixamo hand bone's axes — +Y runs along the hand,
 * the knuckle line is +X on the right hand / −X on the left, the palm faces +Z (measured on the 75
 * full library rigs: fingers within 1–37° of +Y, palm normal within 1° of Z); the index or middle
 * root, when there is one, sets the forward direction and the hand length.
 */
export function gripFrame(b: HandBones, side: Side = 'Right', palm = 0.25): GripFrame {
  const at = (o?: THREE.Object3D) => (o ? inHand(b.hand, o) : undefined);
  const index = at(b.index), middle = at(b.middle), second = at(b.pinky) ?? at(b.ring) ?? (b.index && b.middle ? middle : undefined);
  const thumb = at(b.thumb);
  let fwd: THREE.Vector3, up: THREE.Vector3, len: number, palmDir: THREE.Vector3;
  let from: GripFrame['from'];
  const knuckles = index && second && index.distanceToSquared(second) > 1e-12 ? index.clone().sub(second) : null;
  if (knuckles) {
    from = 'fingers';
    up = knuckles.normalize();
    const tip = middle ?? index!;
    fwd = tip.clone().addScaledVector(up, -tip.dot(up)).normalize();
    len = (middle ?? index!).length();
    const side3 = new THREE.Vector3().crossVectors(fwd, up);
    palmDir = side3.multiplyScalar(thumb && thumb.dot(side3) < 0 ? -1 : 1);
  } else {
    from = 'hand';
    const z = new THREE.Vector3(0, 0, 1);
    const tip = middle ?? index;
    fwd = tip ? tip.clone().addScaledVector(z, -tip.dot(z)) : new THREE.Vector3();
    if (fwd.lengthSq() < 1e-12) fwd.set(0, 1, 0);
    fwd.normalize();
    up = new THREE.Vector3(side === 'Right' ? 1 : -1, 0, 0);
    up.addScaledVector(fwd, -up.dot(fwd)).normalize();
    if (tip && tip.length() > 1e-6) len = tip.length();
    else {
      // no finger roots: from the forearm (the hand's position in its parent), in hand units
      const s = b.hand.scale.x || 1;
      len = (HAND_PER_FOREARM * b.hand.position.length()) / s;
      if (!(len > 0)) {
        b.hand.updateWorldMatrix(true, false);
        len = 0.08 / (new THREE.Vector3().setFromMatrixScale(b.hand.matrixWorld).x || 1);
      }
    }
    palmDir = z;
  }
  const origin = (middle && from === 'fingers' ? middle.clone() : fwd.clone().multiplyScalar(len)).multiplyScalar(0.7).addScaledVector(palmDir, palm * len);
  const side3 = new THREE.Vector3().crossVectors(fwd, up).normalize();
  const m = new THREE.Matrix4().makeBasis(fwd, up, side3);
  m.setPosition(origin);
  return { matrix: m, from };
}

const warned = new Set<string>();
/** console.warn once per message. */
export function warnOnce(msg: string) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(msg);
}

export type Held = { hand: THREE.Object3D; holder: THREE.Group; sync: () => void; rig: Rig; from: GripFrame['from'] };

/**
 * Parents `prop` (already in the hand-frame convention) to the hand of the RENDERED rig (the
 * SkeletonUtils clone, not gltf.scene), in the grip frame, with the bone's world scale cancelled so
 * the prop keeps its size in metres. Call `sync()` every frame — it re-cancels the scale.
 * A rig with no hand bone: warns once and returns null (nothing is attached).
 */
export function holdInHand(rig: THREE.Object3D, prop: THREE.Object3D, side: Side = 'Right', palm = 0.25): Held | null {
  const b = handBones(rig, side);
  if (!b) {
    warnOnce(`hold: no ${side} hand bone (mixamorig${side}Hand or Hand_${side[0]}) in "${rig.name || 'model'}"; the held prop is not drawn`);
    return null;
  }
  const hand = b.hand;
  const frame = gripFrame(b, side, palm);
  const holder = new THREE.Group();
  holder.name = `hold-${side}`;
  frame.matrix.decompose(holder.position, holder.quaternion, new THREE.Vector3());
  holder.add(prop);
  hand.add(holder);
  const ws = new THREE.Vector3();
  const sync = () => {
    hand.updateWorldMatrix(true, false);
    ws.setFromMatrixScale(hand.matrixWorld);
    holder.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
  };
  holder.userData.sync = sync;
  sync();
  return { hand, holder, sync, rig: b.rig, from: frame.from };
}
