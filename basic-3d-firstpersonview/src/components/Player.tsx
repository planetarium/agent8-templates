import { useFrame } from '@react-three/fiber';
import { PLAYER } from '../config';
import { input, moveAxis, nowSeconds, wantsRun } from '../game/input';
import { stepPlayer } from '../game/player';
import { player, rig } from '../game/state';
import { BOXES, FIELDS, RAMPS, boxAabb, type Aabb } from '../game/world';

const SUBSTEP = 1 / 120;
const axis = { x: 0, y: 0 };
const move = { x: 0, z: 0 };

/** Static boxes. Moving boxes (platforms) go here too and are moved before each substep — see PROJECT/Structure.md. */
const COLLIDERS: Aabb[] = BOXES.map(boxAabb);

/**
 * Kinematic controller (game/player.ts). The local player has no visible body:
 * the camera (CameraRig) is its eyes. Character.tsx is still here for other
 * characters (NPCs, remote players).
 */
export function Player() {
  useFrame((_, delta) => {
    moveAxis(axis);
    // view-relative: forward = where the camera looks (yaw only); walk unless running
    const len = Math.hypot(axis.x, axis.y);
    const k = len > 0 ? (wantsRun() ? 1 : PLAYER.walkSpeed / PLAYER.runSpeed) / len : 0;
    const s = Math.sin(rig.yaw);
    const c = Math.cos(rig.yaw);
    move.x = (-s * axis.y + c * axis.x) * k;
    move.z = (-c * axis.y - s * axis.x) * k;

    // Fixed substeps keep collision stable on slow frames.
    const dt = Math.min(delta, 0.1);
    const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
    const now = nowSeconds();
    for (let i = 0; i < steps; i++) {
      stepPlayer(player, move, input, now - dt + ((i + 1) * dt) / steps, dt / steps, COLLIDERS, false, RAMPS, FIELDS);
    }
    // Before CameraRig (priority -1), so the eyes are at this frame's position.
  }, -2);

  return null;
}
