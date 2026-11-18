// Aiming with a split body: the legs walk where the character moves, the upper body aims.
// Pure three (no React); <Character> drives it while it holds a gun with `aim`.
//
// - The split is at the first spine bone above the hips: the hips (position and rotation) and the
//   legs are the lower body, the spine and everything on it (arms, head, the gun) the upper body.
//   Every clip is cut in two halves that animate disjoint bones, so both play in one mixer.
// - Lower body (stepLegs): faces the movement direction, at most LEG_MAX off it toward the aim.
//   When aim and movement are more than REV_ON apart the legs turn round and the clip plays
//   backwards (backpedalling); they turn back under REV_OFF. Standing, the legs turn in place once
//   the aim is STAND_TURN away.
// - Upper body (aimSpine): the aim's yaw and pitch spread over the spine bones, at most TWIST_MAX
//   of twist above the hips. A closed loop measures the line between the two hands (where the gun
//   lies) and corrects the twist, so the gun ends up on the aim whatever the clip or the rig.
// - The gun just follows the hands (hold.ts with aimByBody) — no separate aim turn for it.
// A rig without spine bones gets null from findSpine and keeps the whole-body turn (followAim).
// One-shot upper-body actions (recoil, a swing) would be a third action on the upper half, played
// over the aim layer before aimSpine runs.
import * as THREE from 'three';
import { gripFrame, norm, yawOf } from './hold';

/** Legs face at most this far off the movement direction (45°): more and the feet slide sideways. */
export const LEG_MAX = Math.PI / 4;
/** Aim this far behind the movement → backpedal (legs turn round, clip plays backwards)… */
export const REV_ON = (110 * Math.PI) / 180;
/** …and back to forward walking under this (the 40° gap keeps it from flickering at 90°). */
export const REV_OFF = (70 * Math.PI) / 180;
/** Standing: the legs turn to the aim once it is this far away, and stop within STAND_DONE. */
export const STAND_TURN = Math.PI / 4;
export const STAND_DONE = (5 * Math.PI) / 180;
/** Widest twist of the upper body over the hips (75°); past it the legs have to turn. */
export const TWIST_MAX = (75 * Math.PI) / 180;
/** Widest aim pitch the spine takes (50° up or down). */
export const PITCH_MAX = (50 * Math.PI) / 180;
/** How fast the legs turn to their target (1/s). */
export const LEG_TURN = 10;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

export type SpineRig = { hips: THREE.Object3D; spine: THREE.Object3D[]; upper: Set<string> };

/**
 * Hips and the spine chain above them (bones named spine / chest, child after child), or null when
 * the rig has no hips or no spine bone — then the body cannot be split.
 */
export function findSpine(root: THREE.Object3D): SpineRig | null {
  let hips: THREE.Object3D | undefined;
  root.traverse((o) => {
    if (!hips && /(^|[^a-z])?(hips|pelvis)$/.test(norm(o.name))) hips = o;
  });
  if (!hips) return null;
  const spine: THREE.Object3D[] = [];
  let at: THREE.Object3D = hips;
  for (;;) {
    const next: THREE.Object3D | undefined = at.children.find((c) => /spine|chest/.test(norm(c.name)));
    if (!next) break;
    spine.push(next);
    at = next;
  }
  if (!spine.length) return null;
  const upper = new Set<string>();
  spine[0].traverse((o) => upper.add(o.name));
  return { hips, spine, upper };
}

/** A clip's lower half (hips, legs, anything not on the spine) and upper half (spine and up). */
export function splitClip(clip: THREE.AnimationClip, rig: SpineRig) {
  const lower: THREE.KeyframeTrack[] = [];
  const upper: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    const node = t.name.slice(0, t.name.lastIndexOf('.'));
    (rig.upper.has(node) ? upper : lower).push(t);
  }
  return {
    lower: new THREE.AnimationClip(clip.name, clip.duration, lower),
    upper: new THREE.AnimationClip(`${clip.name}:up`, clip.duration, upper),
  };
}

export type LegState = { yaw: number; reversed: boolean; turning: boolean };

/** One step of the lower body's yaw: where the legs face and whether they walk backwards. */
export function stepLegs(s: LegState, aimYaw: number, moveYaw: number, moving: boolean, dt: number): LegState {
  let target: number;
  let reversed = false;
  let turning = false;
  if (moving) {
    const off = Math.abs(wrap(aimYaw - moveYaw));
    reversed = s.reversed ? off > REV_OFF : off > REV_ON;
    const ref = moveYaw + (reversed ? Math.PI : 0);
    target = ref + clamp(wrap(aimYaw - ref), LEG_MAX);
  } else {
    const off = Math.abs(wrap(aimYaw - s.yaw));
    turning = s.turning ? off > STAND_DONE : off > STAND_TURN;
    target = turning ? aimYaw : s.yaw;
  }
  const yaw = wrap(s.yaw + wrap(target - s.yaw) * Math.min(1, dt * LEG_TURN));
  return { yaw, reversed, turning };
}

/** The upper body's twist over the legs for an aim, plus the learnt correction, within TWIST_MAX. */
export const twistFor = (aimYaw: number, legYaw: number, correction = 0) => clamp(wrap(aimYaw - legYaw) + correction, TWIST_MAX);

/** Share of the twist each spine bone takes, lower bones less (1 : 2 : 3 …), summing to 1. */
export function spineShares(n: number) {
  const total = (n * (n + 1)) / 2;
  return Array.from({ length: n }, (_, i) => (i + 1) / total);
}

const UP = new THREE.Vector3(0, 1, 0);
const _pq = new THREE.Quaternion();
const _qy = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _r = new THREE.Quaternion();
const _ax = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/**
 * Turns the spine of a posed rig (call after the mixer) so the line between the hands points along
 * `aim`. Keeps the bones' clip pose in `base` and the learnt correction in `state`, so it can run
 * every frame without piling up. Returns the twist used (rad) and the hands-line error left (rad).
 */
export function aimSpine(
  rig: SpineRig,
  hands: { grip: THREE.Object3D; support?: THREE.Object3D },
  aim: { yaw: number; pitch: number },
  legYaw: number,
  state: { base: THREE.Quaternion[]; set: THREE.Quaternion[]; corrYaw: number; corrPitch: number; gripLocal?: THREE.Vector3; supportLocal?: THREE.Vector3 },
) {
  const { spine } = rig;
  // the clip pose: what the mixer wrote this frame (or, for a bone no clip moves, the pose before our turn)
  for (let i = 0; i < spine.length; i++) {
    const q = spine[i].quaternion;
    if (!state.base[i]) state.base[i] = q.clone();
    else if (!(state.set[i] && q.equals(state.set[i]))) state.base[i].copy(q);
  }
  state.gripLocal ??= new THREE.Vector3().setFromMatrixPosition(gripFrame(hands.grip).frame);
  if (hands.support) state.supportLocal ??= new THREE.Vector3().setFromMatrixPosition(gripFrame(hands.support).frame);
  const shares = spineShares(spine.length);
  let twist = 0, err = 0;
  for (let pass = 0; pass < 2; pass++) {
    twist = twistFor(aim.yaw, legYaw, state.corrYaw);
    const pitch = clamp(aim.pitch + state.corrPitch, PITCH_MAX);
    const aimYaw = legYaw + twist;
    _ax.set(-Math.cos(aimYaw), 0, Math.sin(aimYaw)); // the aim's right (forward × up)
    spine[0].parent?.updateWorldMatrix(true, false);
    for (let i = 0; i < spine.length; i++) {
      const b = spine[i];
      b.quaternion.copy(state.base[i]);
      _qy.setFromAxisAngle(UP, twist * shares[i]);
      _qp.setFromAxisAngle(_ax, pitch * shares[i]);
      _r.multiplyQuaternions(_qp, _qy); // world-space turn: yaw, then pitch about the aim's right
      b.parent!.matrixWorld.decompose(_a, _pq, _b);
      // local' = P⁻¹ · R · P · local
      b.quaternion.premultiply(_pq).premultiply(_r).premultiply(_pq.invert());
      b.updateWorldMatrix(false, false);
    }
    for (let i = 0; i < spine.length; i++) (state.set[i] ??= new THREE.Quaternion()).copy(spine[i].quaternion);
    // where the hands now hold the gun
    if (!hands.support || !state.supportLocal) break;
    hands.grip.updateWorldMatrix(true, false);
    hands.support.updateWorldMatrix(true, false);
    _a.copy(state.gripLocal).applyMatrix4(hands.grip.matrixWorld);
    _b.copy(state.supportLocal).applyMatrix4(hands.support.matrixWorld).sub(_a);
    const len = _b.length();
    if (len < 0.12 || len > 0.7) break; // support hand off the gun: no line to correct with
    _b.divideScalar(len);
    const ey = wrap(aim.yaw - yawOf(_b.x, _b.z));
    const ep = clamp(aim.pitch, PITCH_MAX) - Math.asin(Math.max(-1, Math.min(1, _b.y)));
    err = Math.hypot(ey, ep);
    state.corrYaw = clamp(state.corrYaw + ey, Math.PI / 4);
    state.corrPitch = clamp(state.corrPitch + ep, Math.PI / 4);
  }
  return { twist, err };
}
