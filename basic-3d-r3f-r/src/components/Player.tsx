import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Ecctrl, type EcctrlHandle } from 'ecctrl';
import { EcctrlAnimationStateController, useEcctrlAnimationStore, type EcctrlAnimationState } from 'ecctrl/animation';
import { useButtonStore, useJoystickStore } from 'ecctrl/input';
import { PLAYER } from '../config';
import { anim, type AnimState } from '../game/anim';
import { input, moveAxis, wantsRun } from '../game/input';
import { player } from '../game/state';
import { Character } from './Character';

/** Float gap + capsule = PLAYER.height, the same 1.6 m the kinematic variant collides with. */
const HALF_HEIGHT = (PLAYER.height - PLAYER.floatHeight) / 2 - PLAYER.radius;
/** Body center → feet: ecctrl floats the capsule floatHeight above the ground. */
const FEET = HALF_HEIGHT + PLAYER.radius + PLAYER.floatHeight;
const SPAWN: [number, number, number] = [PLAYER.spawn[0], PLAYER.spawn[1] + FEET, PLAYER.spawn[2]];

/** ecctrl's animation states → the shared clip state machine in <Character>. */
const ANIM_OF: Record<EcctrlAnimationState, AnimState> = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  JUMP_START: 'jump',
  JUMP_IDLE: 'jump',
  JUMP_FALL: 'fall',
  JUMP_LAND: 'idle',
};

const axis = { x: 0, y: 0 };
const movement = { joystick: axis, run: false, jump: false };

/** ecctrl character (rapier dynamic body) + the shared character model. */
export function Player() {
  const ecctrl = useRef<EcctrlHandle>(null);
  const lastState = useRef<EcctrlAnimationState>('IDLE');

  useFrame(() => {
    const e = ecctrl.current;
    if (!e) return;
    // Keyboard + ecctrl's on-screen stick / JUMP button, fed through the shared input.
    const stick = useJoystickStore.getState().joysticks.default;
    input.joyX = stick?.x ?? 0;
    input.joyY = stick?.y ?? 0;
    moveAxis(axis);
    movement.run = wantsRun();
    movement.jump = input.keys.has('Space') || !!useButtonStore.getState().buttons.jump;
    e.setMovement(movement);

    const p = e.currPos;
    player.pos.x = p.x;
    player.pos.y = p.y - FEET;
    player.pos.z = p.z;
    if (player.pos.y < PLAYER.killY) {
      e.body.setTranslation({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }, true);
      e.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    const s = useEcctrlAnimationStore.getState().animationState;
    if (s === 'JUMP_START' && lastState.current !== 'JUMP_START') anim.jumps++;
    lastState.current = s;
    anim.state = ANIM_OF[s];
  });

  return (
    <>
      <EcctrlAnimationStateController ecctrl={ecctrl} />
      <Ecctrl
        ref={ecctrl}
        position={SPAWN}
        capsuleHalfHeight={HALF_HEIGHT}
        capsuleRadius={PLAYER.radius}
        floatHeight={PLAYER.floatHeight}
        maxWalkVel={PLAYER.walkSpeed}
        maxRunVel={PLAYER.runSpeed}
        jumpVel={PLAYER.jumpVelocity}
        enableToggleRun={false}
      >
        <group position={[0, -FEET, 0]}>
          <Character />
        </group>
      </Ecctrl>
    </>
  );
}
