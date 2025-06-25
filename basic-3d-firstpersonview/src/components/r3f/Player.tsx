import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, Vector3 } from '@react-three/fiber';
import { CollisionPayload } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';

import {
  AnimationConfigMap,
  AnimationType,
  CharacterMovementState,
  CharacterRenderer,
  RigidBodyPlayer,
  RigidBodyPlayerRef,
  useCharacterAnimation,
  useControllerStore,
  useMouseControls,
} from 'vibe-starter-3d';

import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';

import { CharacterState } from '../../constants/character';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

import Assets from '../../assets.json';
import { useEffectStore } from '../../stores/effectStore';
import { EffectType } from '../../types/effect';
import { createBulletEffectConfig } from '../../utils/effectUtils';

const SHOOT_COOLDOWN = 200;
const targetHeight = 1.6;

// States that can be interrupted by actions
const INTERRUPTIBLE_STATES = [
  CharacterState.IDLE,
  CharacterState.IDLE_01,
  CharacterState.WALK,
  CharacterState.RUN,
  CharacterState.FAST_RUN,
  CharacterState.JUMP,
] as const;

// Action types enum
enum ActionType {
  ATTACK = 'attack',
}

// Key mapping with type safety
const keyMapping: Record<ActionType, string[]> = {
  [ActionType.ATTACK]: ['Mouse0'],
};

const animationConfigMap: AnimationConfigMap = {
  [CharacterState.IDLE]: {
    url: Assets.animations['idle-00'].url,
    loop: true,
  },
  [CharacterState.IDLE_01]: {
    url: Assets.animations['idle-01'].url,
    loop: true,
  },
  [CharacterState.WALK]: {
    url: Assets.animations['walk'].url,
    loop: true,
  },
  [CharacterState.RUN]: {
    url: Assets.animations['run-medium'].url,
    loop: true,
  },
  [CharacterState.FAST_RUN]: {
    url: Assets.animations['run-fast'].url,
    loop: true,
  },
  [CharacterState.JUMP]: {
    url: Assets.animations['jump'].url,
    loop: true,
    clampWhenFinished: true,
  },
  [CharacterState.PUNCH]: {
    url: Assets.animations['punch-00'].url,
    loop: false,
    duration: 0.5,
    clampWhenFinished: true,
  },
  [CharacterState.PUNCH_01]: {
    url: Assets.animations['punch-01'].url,
    loop: false,
    duration: 0.5,
    clampWhenFinished: true,
  },
  [CharacterState.KICK]: {
    url: Assets.animations['kick-00'].url,
    loop: false,
    duration: 0.75,
    clampWhenFinished: true,
  },
  [CharacterState.KICK_01]: {
    url: Assets.animations['kick-01'].url,
    loop: false,
    duration: 1,
    clampWhenFinished: true,
  },
  [CharacterState.KICK_02]: {
    url: Assets.animations['kick-02'].url,
    loop: false,
    duration: 1,
    clampWhenFinished: true,
  },
  [CharacterState.MELEE_ATTACK]: {
    url: Assets.animations['melee-attack'].url,
    loop: false,
    duration: 1,
    clampWhenFinished: true,
  },
  [CharacterState.CAST]: {
    url: Assets.animations['cast'].url,
    loop: false,
    duration: 1,
    clampWhenFinished: true,
  },
  [CharacterState.HIT]: {
    url: Assets.animations['hit-to-body'].url,
    loop: false,
    clampWhenFinished: false,
  },
  [CharacterState.DANCE]: {
    url: Assets.animations['dance'].url,
    loop: false,
    clampWhenFinished: false,
  },
  [CharacterState.SWIM]: {
    url: Assets.animations['swim'].url,
    loop: true,
  },
  [CharacterState.DIE]: {
    url: Assets.animations['death-backward'].url,
    loop: false,
    clampWhenFinished: true,
  },
};

/**
 * Player props
 */
interface PlayerProps {
  /** Initial position of the player */
  position?: Vector3;
}

/**
 * Player component that manages character model and animations
 *
 * Handles player state management and delegates rendering to CharacterRenderer.
 * Movement states come from ControllerStore, actions are handled locally.
 */
const Player = ({ position }: PlayerProps) => {
  const { account } = useGameServer();
  const { registerConnectedPlayer, unregisterConnectedPlayer } = useMultiPlayerStore();
  const { setPosition: setLocalPlayerPosition } = useLocalPlayerStore();

  // Use the new useCharacterAnimation hook
  const { animationState, setAnimation, getAnimation } = useCharacterAnimation<CharacterState>(CharacterState.IDLE);

  const camera = useThree((state) => state.camera);

  // Get movement state from controller store (unified API)
  const { getCharacterMovementState, isControlLocked, unlockControls } = useControllerStore();

  // IMPORTANT: rigidBodyPlayerRef.current type is RigidBody
  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);

  const shootTimestamp = useRef(0);
  const lastFrameAttack = useRef(false);

  // IMPORTANT: Register connected player reference
  useEffect(() => {
    if (!account) return;

    registerConnectedPlayer(account, rigidBodyPlayerRef);

    return () => {
      unregisterConnectedPlayer(account);
    };
  }, [account, registerConnectedPlayer, unregisterConnectedPlayer]);

  // IMPORTANT: Update local player store position information
  useFrame(() => {
    const playerRigidBody = rigidBodyPlayerRef.current;
    if (!playerRigidBody) return;

    const position = playerRigidBody.translation();
    setLocalPlayerPosition(position.x, position.y, position.z);
  });

  // Get addEffect action from the store
  const addEffect = useEffectStore((state) => state.addEffect);

  // Callback for Player to request a cast
  const spawnEffect = useCallback(
    async (type: string, config?: { [key: string]: any }) => {
      if (!account) return;

      // Add effect locally via store
      addEffect(type, account, config);
    },
    [addEffect, account],
  );

  // Action input state management - only for actions, not movement
  const actionInputRef = useRef<Partial<Record<ActionType, boolean>>>({});

  // Set up key event listeners for actions only
  useEffect(() => {
    const actionKeys = Object.values(ActionType);

    const initialState: Partial<Record<ActionType, boolean>> = {};
    actionKeys.forEach((action) => {
      initialState[action] = false;
    });
    actionInputRef.current = initialState;

    const handleKeyDown = (event: KeyboardEvent) => {
      actionKeys.forEach((action: ActionType) => {
        if (keyMapping[action]?.includes(event.code)) {
          actionInputRef.current[action] = true;
        }
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      actionKeys.forEach((action: ActionType) => {
        if (keyMapping[action]?.includes(event.code)) {
          actionInputRef.current[action] = false;
        }
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      const mouseButton = `Mouse${event.button}`;
      actionKeys.forEach((action: ActionType) => {
        if (keyMapping[action]?.includes(mouseButton)) {
          actionInputRef.current[action] = true;
        }
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      const mouseButton = `Mouse${event.button}`;
      actionKeys.forEach((action: ActionType) => {
        if (keyMapping[action]?.includes(mouseButton)) {
          actionInputRef.current[action] = false;
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Helper functions
  const canInterrupt = useCallback((state: CharacterState): boolean => {
    return INTERRUPTIBLE_STATES.includes(state);
  }, []);

  // Convert ControllerStore state to Player animation state
  const toCharacterState = useCallback((characterMovementState: CharacterMovementState): CharacterState => {
    switch (characterMovementState) {
      case CharacterMovementState.IDLE:
        return CharacterState.IDLE;
      case CharacterMovementState.MOVING:
        return CharacterState.WALK;
      case CharacterMovementState.SPRINTING:
        return CharacterState.RUN;
      case CharacterMovementState.AIRBORNE:
        return CharacterState.JUMP;
      default:
        return CharacterState.IDLE;
    }
  }, []);

  // Callback triggered when a non-looping animation finishes.
  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      unlockControls();
      switch (type) {
        case CharacterState.PUNCH:
        case CharacterState.PUNCH_01:
          setAnimation(CharacterState.IDLE_01);
          break;
        case CharacterState.KICK:
        case CharacterState.KICK_01:
        case CharacterState.KICK_02:
          setAnimation(CharacterState.IDLE_01);
          break;
        case CharacterState.CAST:
          setAnimation(CharacterState.IDLE_01);
          break;
        case CharacterState.HIT:
          setAnimation(CharacterState.IDLE_01);
          break;
        case CharacterState.MELEE_ATTACK:
          setAnimation(CharacterState.IDLE_01);
          break;
        case CharacterState.DANCE:
          setAnimation(CharacterState.IDLE);
          break;
        default:
          break;
      }
    },
    [unlockControls],
  );

  const updatePlayerState = useCallback((): void => {
    const currentState = getAnimation();

    // If controls are locked, don't process actions
    if (isControlLocked()) {
      return;
    }

    // Handle death and revive states
    // TODO: Connect with actual game state
    // const isRevive = playerHealth > 0 && currentState === CharacterState.DIE;
    // const isDying = playerHealth <= 0 && currentState !== CharacterState.DIE;

    // Currently using placeholder false values
    const isRevive = false;
    const isDying = false;

    // Revive handling: when health is restored while in death state
    if (isRevive) {
      setAnimation(CharacterState.IDLE);
      return;
    }

    // Death handling: when health drops to 0 or below
    if (isDying) {
      setAnimation(CharacterState.DIE);
      return;
    }

    // For movement states, use ControllerStore state
    if (canInterrupt(currentState)) {
      const characterMovementState = getCharacterMovementState();
      const characterState = toCharacterState(characterMovementState);
      setAnimation(characterState);
    }
  }, [isControlLocked, canInterrupt, getCharacterMovementState, toCharacterState]);

  // Update player action state based on inputs and physics
  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;
    updatePlayerState();
    // Shooting Logic
    const attack = actionInputRef.current[ActionType.ATTACK];
    const now = Date.now();
    const canAttack = attack && !lastFrameAttack.current;
    lastFrameAttack.current = attack;
    if (canAttack && now > shootTimestamp.current) {
      shootTimestamp.current = now + SHOOT_COOLDOWN;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const bulletSpeed = 200;
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      const startPosition = cameraPosition.add(direction.clone().multiplyScalar(1.5));
      spawnEffect(
        EffectType.BULLET,
        createBulletEffectConfig({ startPosition, direction, speed: bulletSpeed, duration: 500, scale: 3, flashDuration: 30, color: 'black' }),
      );
    }
  });

  /** handleTriggerEnter: Called when the player intersects or collides with another object.
   * - Handles when entering a specific area or colliding with another object
   */
  const handleTriggerEnter = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // TODO: Handle when entering a specific area or colliding with another object
    }
  };

  /** handleTriggerExit: Called when the player exits an intersection or ends a collision with another object.
   * - Handles when exiting a specific area or when collision with another object ends
   */
  const handleTriggerExit = (payload: CollisionPayload) => {
    if (payload.other.rigidBody?.userData?.['type']) {
      // TODO: Handle when exiting a specific area or when collision with another object ends
    }
  };

  return (
    <RigidBodyPlayer
      ref={rigidBodyPlayerRef}
      userData={{ account, type: RigidBodyObjectType.LOCAL_PLAYER }}
      position={position}
      targetHeight={targetHeight}
      onTriggerEnter={handleTriggerEnter}
      onTriggerExit={handleTriggerExit}
    >
      <CharacterRenderer
        /**
         * IMPORTANT: In First Person View (FPS), the player's own character should not be visible,
         * so the visible property is set to false. This setting is crucial for the FPS implementation.
         */
        visible={false}
        url={Assets.characters['base-model'].url}
        animationConfigMap={animationConfigMap}
        animationState={animationState}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
};

export default Player;
