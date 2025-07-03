import { useRef, useEffect, useCallback } from 'react';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CollisionPayload } from '@react-three/rapier';
import { useGameServer } from '@agent8/gameserver';

import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';

import { CharacterState } from '../../constants/character';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';

import Assets from '../../assets.json';
import {
  AnimationConfigMap,
  AnimationType,
  CharacterMovementState,
  CharacterRenderer,
  RigidBodyPlayer,
  RigidBodyPlayerRef,
  useCharacterAnimation,
  useControllerStore,
} from 'vibe-starter-3d';
import { usePlayerActionStore } from '../../stores/playerActionStore';

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

// Animation configuration map moved outside component for better performance
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
  const { getPlayerAction } = usePlayerActionStore();

  // Use the new useCharacterAnimation hook
  const { animationState, setAnimation, getAnimation } = useCharacterAnimation<CharacterState>(CharacterState.IDLE);

  // Get movement state from controller store (unified API)
  const { getCharacterMovementState, isControlLocked, lockControls, unlockControls } = useControllerStore();

  // IMPORTANT: rigidBodyPlayerRef.current type is RigidBody
  const rigidBodyPlayerRef = useRef<RigidBodyPlayerRef>(null);

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

  // Helper functions
  const canInterrupt = useCallback((state: CharacterState): boolean => {
    return INTERRUPTIBLE_STATES.includes(state);
  }, []);

  // Convert ControllerStore state to Player animation state
  const toCharacterState = useCallback((characterMovementState: CharacterMovementState): CharacterState => {
    switch (characterMovementState) {
      case CharacterMovementState.IDLE:
        return CharacterState.IDLE;
      case CharacterMovementState.WALKING:
        return CharacterState.WALK;
      case CharacterMovementState.RUN:
        return CharacterState.RUN;
      case CharacterMovementState.FAST_RUN:
        return CharacterState.FAST_RUN;
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
    [unlockControls, setAnimation],
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

    // Handle action states (punch, kick, etc.) - highest priority
    if (getPlayerAction('punch') && canInterrupt(currentState)) {
      setAnimation(CharacterState.PUNCH);
      lockControls();
      return;
    }

    if (getPlayerAction('kick') && canInterrupt(currentState)) {
      setAnimation(CharacterState.KICK);
      lockControls();
      return;
    }

    if (getPlayerAction('meleeAttack') && canInterrupt(currentState)) {
      setAnimation(CharacterState.MELEE_ATTACK);
      lockControls();
      return;
    }

    if (getPlayerAction('cast') && canInterrupt(currentState)) {
      setAnimation(CharacterState.CAST);
      lockControls();
      return;
    }

    // For movement states, use ControllerStore state
    if (canInterrupt(currentState)) {
      const characterMovementState = getCharacterMovementState();
      const characterState = toCharacterState(characterMovementState);
      setAnimation(characterState);
    }
  }, [isControlLocked, canInterrupt, lockControls, getCharacterMovementState, toCharacterState, getAnimation, setAnimation, getPlayerAction]);

  // Update player action state based on inputs and physics
  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;
    updatePlayerState();
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
