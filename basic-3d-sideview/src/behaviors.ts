/**
 * The two behaviors every 3D character template shares:
 * - FollowLight: the shadow sun tracks the player at a fixed offset
 * - CharacterAnimator: maps the controller's movement state to animation
 *   assets (mixamo clips retarget onto the model automatically)
 */
import { Behavior } from 'incanto';
import type { CharacterController3D, ModelInstance3D, Node3D } from 'incanto/3d';

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
  private acting = false;

  override onReady(): void {
    const controller = this.node as CharacterController3D;
    const skin = controller.getNodeOrNull('../Skin') as ModelInstance3D | null;
    if (!skin) return;
    controller.on('movementStateChanged', (state) => {
      if (this.acting) return; // combat one-shots lock the animation
      const clip = STATE_CLIPS[state as string];
      if (clip) skin.animation = clip;
    });
    skin.on('animationFinished', () => {
      if (!this.acting) return;
      this.acting = false;
      skin.animationLoop = true;
      skin.animation = STATE_CLIPS[controller.state] ?? '$anims/idle';
    });
  }

  override update(): void {
    if (this.acting) return;
    const input = this.engine.input;
    try {
      if (!input.justPressed('punch')) return;
    } catch {
      return; // template without combat actions
    }
    const controller = this.node as CharacterController3D;
    const skin = controller.getNodeOrNull('../Skin') as ModelInstance3D | null;
    if (!skin) return;
    this.acting = true;
    skin.animationLoop = false;
    skin.animation = '$anims/punch';
  }
}
