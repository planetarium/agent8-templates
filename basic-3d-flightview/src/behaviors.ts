/**
 * Flight behaviors — every constant mirrors the original FlightViewController:
 * maxSpeed 120, throttle +20/-80 per second, pitch 0.5 rad/s, roll π/2 rad/s,
 * yaw accel 0.3, ground rotation authority scales below 20 m/s, chase camera
 * (0,3,15) with quaternion slerp 0.08 / pos lerp 5 / up lerp 1.5, FOV 30.
 */
import { Behavior } from 'incanto';
import type { Camera3D, MeshInstance3D as MeshNodeType, Node3D } from 'incanto/3d';
import { MeshInstance3D } from 'incanto/3d';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

const MAX_SPEED = 120;
const SPEED_UP = 20;
const SPEED_DOWN = 80;
const PITCH_SPEED = 0.5;
const ROLL_SPEED = Math.PI * 0.5;
const YAW_ACCEL = 0.3;
const FULL_ROTATION_SPEED = 20;
const GROUND_ALTITUDE = 1.0;
const CAMERA_OFFSET = new Vector3(0, 3, 15);
const SHOOT_COOLDOWN_MS = 200;
const BULLET_SPEED = 200;
const BULLET_LIFE_MS = 500;
const RAD2DEG = 180 / Math.PI;

const LIGHT_OFFSET: [number, number, number] = [30, 100, 30];

export class FollowLight extends Behavior {
  override update(): void {
    const player = this.node.getRoot().getNodesByName('Plane')[0] as Node3D | undefined;
    if (!player) return;
    (this.node as Node3D).position = [
      (player.position[0] ?? 0) + LIGHT_OFFSET[0],
      (player.position[1] ?? 0) + LIGHT_OFFSET[1],
      (player.position[2] ?? 0) + LIGHT_OFFSET[2],
    ];
  }
}

/** 100 white stripes down the runway centerline, spawned once. */
export class RunwayMarkings extends Behavior {
  override onReady(): void {
    for (let i = 0; i < 100; i++) {
      const stripe = new MeshInstance3D(`Stripe${i}`);
      stripe.mesh = 'box';
      stripe.size = [0.4, 0.02, 5];
      stripe.position = [0, 0.02, -500 + i * 10];
      stripe.material = { color: '#ffffff', roughness: 1 };
      this.node.addChild(stripe);
    }
  }
}

interface Bullet {
  node: Node3D;
  dir: Vector3;
  born: number;
}

export class FlightControl extends Behavior {
  speed = 0;
  private quat = new Quaternion();
  private delayedQuat = new Quaternion();
  private yawVel = 0;
  private bullets: Bullet[] = [];
  private lastShot = -Infinity;
  private clock = 0;
  private readonly samples: { d: number; t: number }[] = [];
  /** HUD speed: rolling average of the last 5 frames (original parity). */
  measuredSpeed = 0;

  override update(dt: number): void {
    this.clock += dt * 1000;
    const node = this.node as Node3D;
    const input = this.engine.input;

    if (input.justPressed('reset')) {
      node.position = [0, 0.3, 0];
      this.quat.identity();
      this.delayedQuat.identity();
      this.speed = 0;
      this.yawVel = 0;
    }

    // throttle
    if (input.isPressed('throttleUp')) this.speed = Math.min(MAX_SPEED, this.speed + SPEED_UP * dt);
    if (input.isPressed('throttleDown')) this.speed = Math.max(0, this.speed - SPEED_DOWN * dt);

    // rotation authority shrinks on the ground below 20 m/s
    const airborne = (node.position[1] ?? 0) > GROUND_ALTITUDE;
    let scale = 1;
    if (!airborne) scale = this.speed < 0.01 ? 0 : Math.min(1, this.speed / FULL_ROTATION_SPEED);

    const stick = input.getVector('pitch'); // up/down = pitch, left/right = roll
    const pitch = -stick.y * PITCH_SPEED * dt * scale;
    const roll = -stick.x * ROLL_SPEED * 0.5 * dt * scale;
    // yaw is an ACCELERATED velocity in rad/s (original: 0.3 rad/s² while
    // held), applied per-frame as yawVel·dt — decays when no key is held
    const yawDir = (input.isPressed('yawLeft') ? 1 : 0) - (input.isPressed('yawRight') ? 1 : 0);
    if (yawDir !== 0) this.yawVel += yawDir * YAW_ACCEL * dt;
    else this.yawVel *= Math.exp(-3 * dt);

    // pitch/roll about LOCAL axes, yaw about WORLD Y (original parity)
    this.quat.multiply(new Quaternion().setFromEuler(new Euler(pitch, 0, roll)));
    this.quat.premultiply(new Quaternion().setFromEuler(new Euler(0, this.yawVel * dt * scale, 0)));

    // fly along local -Z
    const forward = new Vector3(0, 0, -1).applyQuaternion(this.quat);
    const prev = new Vector3(node.position[0] ?? 0, node.position[1] ?? 0, node.position[2] ?? 0);
    const next = prev.clone().addScaledVector(forward, this.speed * dt);
    if (next.y < 0.3) next.y = 0.3; // the runway is solid
    node.position = [next.x, next.y, next.z];
    const e = new Euler().setFromQuaternion(this.quat, 'XYZ');
    node.rotation = [e.x * RAD2DEG, e.y * RAD2DEG, e.z * RAD2DEG];

    // measured speed (5-frame rolling average — what the HUD shows)
    this.samples.push({ d: next.distanceTo(prev), t: dt });
    if (this.samples.length > 5) this.samples.shift();
    const sumT = this.samples.reduce((a, s) => a + s.t, 0);
    this.measuredSpeed = sumT > 0 ? this.samples.reduce((a, s) => a + s.d, 0) / sumT : 0;

    // propeller spins with speed (capped at 60)
    const prop = node.getNodeOrNull('Propeller') as Node3D | null;
    if (prop) {
      const r = prop.rotation;
      prop.rotation = [
        r[0] ?? 0,
        r[1] ?? 0,
        (r[2] ?? 0) - 1.0 * dt * Math.min(60, this.speed) * RAD2DEG,
      ];
    }

    this.updateCamera(node, dt);
    this.updateBullets(node, forward, input, dt);
  }

  private updateCamera(node: Node3D, dt: number): void {
    const camera = this.node.getRoot().getNodesByName('Camera')[0] as Camera3D | undefined;
    if (!camera) return;
    this.delayedQuat.slerp(this.quat, 0.08);
    const target = new Vector3(0, 0, CAMERA_OFFSET.z).applyQuaternion(this.delayedQuat);
    target.y += CAMERA_OFFSET.y;
    target.add(new Vector3(node.position[0] ?? 0, node.position[1] ?? 0, node.position[2] ?? 0));
    const cur = new Vector3(
      camera.position[0] ?? 0,
      camera.position[1] ?? 0,
      camera.position[2] ?? 0,
    );
    cur.lerp(target, 1 - Math.exp(-5 * dt));
    camera.position = [cur.x, cur.y, cur.z];
    // lookAt with a rolled up-vector → the camera banks with the plane
    const up = new Vector3(0, 1, 0)
      .applyQuaternion(this.delayedQuat)
      .lerp(new Vector3(0, 1, 0), 0)
      .normalize();
    const m = new Matrix4().lookAt(
      cur,
      new Vector3(node.position[0] ?? 0, node.position[1] ?? 0, node.position[2] ?? 0),
      up,
    );
    const e = new Euler().setFromRotationMatrix(m, 'XYZ');
    camera.rotation = [e.x * RAD2DEG, e.y * RAD2DEG, e.z * RAD2DEG];
  }

  private updateBullets(
    node: Node3D,
    forward: Vector3,
    input: { isPressed(a: string): boolean },
    dt: number,
  ): void {
    if (input.isPressed('fire') && this.clock - this.lastShot >= SHOOT_COOLDOWN_MS) {
      this.lastShot = this.clock;
      const bullet = new MeshInstance3D('Bullet');
      bullet.mesh = 'box';
      bullet.size = [0.15, 0.15, 0.9]; // 0.1×0.3 × default(0.5,1) × scale 3
      bullet.material = { color: '#111111', emissive: '#111111', emissiveIntensity: 2 };
      const start = new Vector3(
        node.position[0] ?? 0,
        (node.position[1] ?? 0) + 0.5,
        node.position[2] ?? 0,
      ).addScaledVector(forward, 2);
      bullet.position = [start.x, start.y, start.z];
      bullet.rotation = (this.node as Node3D).rotation.slice() as number[];
      this.node.getRoot().addChild(bullet);
      this.bullets.push({ node: bullet, dir: forward.clone(), born: this.clock });
    }
    for (const b of [...this.bullets]) {
      if (this.clock - b.born >= BULLET_LIFE_MS || (b.node.position[1] ?? 0) < 0) {
        b.node.parent?.removeChild(b.node);
        this.bullets.splice(this.bullets.indexOf(b), 1);
        continue;
      }
      b.node.position = [
        (b.node.position[0] ?? 0) + b.dir.x * BULLET_SPEED * dt,
        (b.node.position[1] ?? 0) + b.dir.y * BULLET_SPEED * dt,
        (b.node.position[2] ?? 0) + b.dir.z * BULLET_SPEED * dt,
      ];
    }
  }
}

export type { MeshNodeType };

/**
 * The original's 500 scattered ground objects + 150 floating sky shapes,
 * seeded so every load looks the same. Ground: box/sphere/cylinder in greens
 * and browns, pushed off the runway. Sky: bright kinematic shapes drifting
 * in circles.
 */
export class DecorSpawner extends Behavior {
  private seed = 12345;
  private floats: {
    node: Node3D;
    cx: number;
    cz: number;
    y0: number;
    r: number;
    sp: number;
    amp: number;
    a: number;
  }[] = [];

  private rand(lo: number, hi: number): number {
    const v = Math.sin(this.seed++) * 10000;
    return lo + (v - Math.floor(v)) * (hi - lo);
  }

  override onReady(): void {
    const GREENS_BROWNS = ['#5a8a38', '#6b9c46', '#88ab6c', '#8b4513', '#a0522d'];
    const BRIGHTS = [
      '#ff4444',
      '#4477ff',
      '#ffdd44',
      '#ffffff',
      '#ff8833',
      '#aa66ff',
      '#44dddd',
      '#ff77bb',
    ];
    const MESHES = ['box', 'sphere', 'cylinder'] as const;
    for (let i = 0; i < 500; i++) {
      let x = this.rand(-500, 500);
      if (Math.abs(x) < 8) x = Math.sign(x || 1) * (8 + this.rand(0, 1) * 492);
      const z = this.rand(-500, 500);
      const s = this.rand(1, 4);
      const h = s * this.rand(0.8, 1.5);
      const deco = new MeshInstance3D(`Deco${i}`);
      deco.mesh = MESHES[Math.floor(this.rand(0, 3)) % 3] as string;
      deco.size = [s, h, s];
      deco.position = [x, h / 2, z];
      deco.rotation = [0, this.rand(0, 360), 0];
      deco.material = {
        color: GREENS_BROWNS[Math.floor(this.rand(0, 5)) % 5] as string,
        roughness: 0.8,
        metalness: 0.1,
      };
      deco.castShadow = true;
      this.node.addChild(deco);
    }
    for (let i = 0; i < 150; i++) {
      const s = this.rand(5, 10);
      const shape = new MeshInstance3D(`Float${i}`);
      shape.mesh = (['sphere', 'box', 'capsule'] as const)[
        Math.floor(this.rand(0, 3)) % 3
      ] as string;
      shape.size = [s, s, s];
      const cx = this.rand(-1500, 1500);
      const cz = this.rand(-1500, 1500);
      const y0 = this.rand(100, 400);
      shape.position = [cx, y0, cz];
      shape.material = {
        color: BRIGHTS[Math.floor(this.rand(0, 8)) % 8] as string,
        roughness: 0.5,
      };
      this.node.addChild(shape);
      this.floats.push({
        node: shape,
        cx,
        cz,
        y0,
        r: this.rand(10, 20),
        sp: this.rand(0.1, 0.4),
        amp: this.rand(1, 5),
        a: this.rand(0, Math.PI * 2),
      });
    }
  }

  override update(dt: number): void {
    for (const f of this.floats) {
      f.a += f.sp * dt;
      f.node.position = [
        f.cx + Math.cos(f.a) * f.r,
        f.y0 + Math.sin(f.a * 0.5 + f.cx) * f.amp,
        f.cz + Math.sin(f.a) * f.r,
      ];
    }
  }
}
