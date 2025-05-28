import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, Vector3 } from '@react-three/fiber';
import { CharacterState } from '../../constants/character';
import { AnimationConfigMap, AnimationType, CharacterRenderer, RigidBodyPlayer, RigidBodyPlayerRef, useControllerState } from 'vibe-starter-3d';
import { useGameServer } from '@agent8/gameserver';
import { useMultiPlayerStore } from '../../stores/multiPlayerStore';
import Assets from '../../assets.json';
import { RigidBodyObjectType } from '../../constants/rigidBodyObjectType';
import { CollisionPayload } from '@react-three/rapier';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';

const targetHeight = 1.6;

interface PlayerInputs {
  isRevive: boolean;
  isDying: boolean;
  isPunching: boolean;
  isKicking: boolean;
  isMeleeAttack: boolean;
  isCasting: boolean;
  isJumping: boolean;
  isMoving: boolean;
  isRunning: boolean;
  currentVelY: number;
}

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
 */
const Player = ({ position }: PlayerProps) => {
  const { account } = useGameServer();
  const { registerConnectedPlayer, unregisterConnectedPlayer } = useMultiPlayerStore();
  const { setPosition: setLocalPlayerPosition } = useLocalPlayerStore();
  const currentStateRef = useRef<CharacterState>(CharacterState.IDLE);
  const [, getKeyboardInputs] = useKeyboardControls();
  const { setEnableInput } = useControllerState();

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

  // Memoized map of animation configurations.
  const animationConfigMap: AnimationConfigMap = useMemo(
    () => ({
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
    }),
    [],
  );

  // Callback triggered when a non-looping animation finishes.
  const handleAnimationComplete = useCallback(
    (type: AnimationType) => {
      setEnableInput(true);
      switch (type) {
        case CharacterState.PUNCH:
        case CharacterState.PUNCH_01:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.KICK:
        case CharacterState.KICK_01:
        case CharacterState.KICK_02:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.CAST:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.HIT:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.MELEE_ATTACK:
          currentStateRef.current = CharacterState.IDLE_01;
          break;
        case CharacterState.DANCE:
          currentStateRef.current = CharacterState.IDLE;
          break;
        default:
          break;
      }
    },
    [setEnableInput],
  );

  const determinePlayerState = useCallback(
    (
      currentState: CharacterState,
      { isRevive, isDying, isPunching, isKicking, isMeleeAttack, isCasting, isJumping, isMoving, isRunning }: PlayerInputs,
    ): CharacterState => {
      if (isRevive && currentState === CharacterState.DIE) {
        return CharacterState.IDLE;
      }
      // Maintain death state
      if (isDying || currentState === CharacterState.DIE) {
        return CharacterState.DIE;
      }

      // Punch animation - start only if not already punching
      if (
        isPunching &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.PUNCH;
      }

      // Kick animation - start only if not already punching
      if (
        isKicking &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.KICK;
      }

      // Melee attack animation - start only if not already punching or kicking
      if (
        isMeleeAttack &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.MELEE_ATTACK;
      }

      // Cast animation - start only if not already punching or kicking
      if (
        isCasting &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        setEnableInput(false);
        return CharacterState.CAST;
      }

      // Jump animation (can't jump while punching)
      if (
        isJumping &&
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        return CharacterState.JUMP;
      }

      // Moving state
      if (
        [CharacterState.IDLE, CharacterState.IDLE_01, CharacterState.WALK, CharacterState.RUN, CharacterState.FAST_RUN, CharacterState.JUMP].includes(
          currentState,
        )
      ) {
        if (isMoving) {
          if (isRunning) {
            return CharacterState.RUN;
          } else {
            return CharacterState.WALK;
          }
        } else {
          if (currentState != CharacterState.IDLE_01) {
            return CharacterState.IDLE;
          }
        }
      }
      // Default - maintain current action
      return currentState;
    },
    [setEnableInput],
  );

  // Update player action state based on inputs and physics
  useFrame(() => {
    if (!rigidBodyPlayerRef.current) return;

    const {
      forward,
      backward,
      leftward,
      rightward,
      run: isRunning,
      jump: isJumping,
      action1: isPunching,
      action2: isKicking,
      action3: isMeleeAttack,
      action4: isCasting,
    } = getKeyboardInputs();

    const currentVel = rigidBodyPlayerRef.current.linvel?.() || { y: 0 };

    // Check if player is moving
    const isMoving = forward || backward || leftward || rightward;

    // Call action determination logic
    // 5. Determine player state
    currentStateRef.current = determinePlayerState(currentStateRef.current, {
      isRevive: false,
      isDying: false,
      isPunching,
      isKicking,
      isMeleeAttack,
      isCasting,
      isJumping,
      isMoving,
      isRunning,
      currentVelY: currentVel.y,
    });
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
        currentAnimationRef={currentStateRef}
        targetHeight={targetHeight}
        onAnimationComplete={handleAnimationComplete}
      />
    </RigidBodyPlayer>
  );
};

export default Player;
