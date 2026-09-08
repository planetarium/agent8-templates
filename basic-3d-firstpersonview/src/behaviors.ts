/**
 * The two behaviors every 3D character template shares:
 * - FollowLight: the shadow sun tracks the player at a fixed offset
 * - CharacterAnimator: maps the controller's movement state to animation
 *   assets (mixamo clips retarget onto the model automatically)
 */
import { Behavior } from 'incanto';
import type { CharacterController3D, ModelInstance3D, Node3D } from 'incanto/3d';
import { MeshInstance3D } from 'incanto/3d';

const LIGHT_OFFSET: [number, number, number] = [30, 100, 30];

export class FollowLight extends Behavior {
  override update(): void {
    const player = this.node.getRoot().getNodesByName('Player')[0] as Node3D | undefined;
    if (!player) return;
    const light = this.node as Node3D;
    light.position = [
      (player.position[0] ?? 0) + LIGHT_OFFSET[0],
      (player.position[1] ?? 0) + LIGHT_OFFSET[1],
      (player.position[2] ?? 0) + LIGHT_OFFSET[2],
    ];
  }
}

const STATE_CLIPS: Record<string, string> = {
  idle: '$anims/idle',
  walk: '$anims/walk',
  run: '$anims/run',
  fastRun: '$anims/runFast',
  airborne: '$anims/jump',
};

export class CharacterAnimator extends Behavior {
  override onReady(): void {
    const controller = this.node as CharacterController3D;
    const skin = controller.getNodeOrNull('../Skin') as ModelInstance3D | null;
    if (!skin) return;
    controller.on('movementStateChanged', (state) => {
      const clip = STATE_CLIPS[state as string];
      if (clip) skin.animation = clip;
    });
  }
}

const SHOOT_COOLDOWN_MS = 200;
const BULLET_SPEED = 200;
const BULLET_LIFE_MS = 500;
const BULLET_VISIBLE_AFTER_MS = 150;

interface Bullet {
  node: Node3D;
  dir: [number, number, number];
  born: number;
}

/**
 * The FPV fire system (original parity numbers): left click spawns an
 * emissive black tracer 1.5 units ahead of the eye, flying 200 u/s along the
 * camera direction, visible after 150ms, gone at 500ms or on hitting the
 * floor. 200ms cooldown between shots.
 */
export class BulletGun extends Behavior {
  private bullets: Bullet[] = [];
  private lastShot = -Infinity;
  private clock = 0;

  override update(dt: number): void {
    this.clock += dt * 1000;
    const input = this.engine.input;
    const controller = this.node.getNodeOrNull('Controller') as CharacterController3D | null;
    if (!controller) return;

    if (input.isPressed('attack') && this.clock - this.lastShot >= SHOOT_COOLDOWN_MS) {
      this.lastShot = this.clock;
      this.fire(controller);
    }

    for (const b of [...this.bullets]) {
      const age = this.clock - b.born;
      if (age >= BULLET_LIFE_MS || (b.node.position[1] ?? 0) < 0.05) {
        b.node.parent?.removeChild(b.node);
        this.bullets = this.bullets.filter((x) => x !== b);
        continue;
      }
      b.node.visible = age >= BULLET_VISIBLE_AFTER_MS;
      b.node.position = [
        (b.node.position[0] ?? 0) + b.dir[0] * BULLET_SPEED * dt,
        (b.node.position[1] ?? 0) + b.dir[1] * BULLET_SPEED * dt,
        (b.node.position[2] ?? 0) + b.dir[2] * BULLET_SPEED * dt,
      ];
    }
  }

  private fire(controller: CharacterController3D): void {
    const { yaw, pitch } = controller;
    const cp = Math.cos(pitch);
    const dir: [number, number, number] = [
      -Math.sin(yaw) * cp,
      -Math.sin(pitch),
      -Math.cos(yaw) * cp,
    ];
    const eye: [number, number, number] = [
      (this.node as Node3D).position[0] ?? 0,
      ((this.node as Node3D).position[1] ?? 0) + controller.eyeHeight,
      (this.node as Node3D).position[2] ?? 0,
    ];
    const bullet = new MeshInstance3D('Bullet');
    bullet.mesh = 'box';
    bullet.size = [0.05, 0.05, 0.15];
    bullet.material = { color: '#111111', emissive: '#111111', emissiveIntensity: 2 };
    bullet.position = [eye[0] + dir[0] * 1.5, eye[1] + dir[1] * 1.5, eye[2] + dir[2] * 1.5];
    bullet.rotation = [(-pitch * 180) / Math.PI, (yaw * 180) / Math.PI, 0];
    bullet.visible = false;
    this.node.getRoot().addChild(bullet);
    this.bullets.push({ node: bullet, dir, born: this.clock });
  }
}
