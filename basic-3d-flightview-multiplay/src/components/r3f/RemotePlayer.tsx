import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { CuboidCollider, interactionGroups } from '@react-three/rapier';
import { Vector3, Quaternion } from '@react-three/fiber';
import { ActiveCollisionTypes, RigidBody } from '@dimforge/rapier3d-compat';
import { NetworkObject, NetworkObjectHandle, CollisionGroup, toVector3 } from 'vibe-starter-3d';
import { Aircraft } from './Aircraft';
import { AircraftState } from '../../constants/aircraft';
import { usePlayerStore } from '../../store/playerStore';

interface RemotePlayerProps {
  account: string;
  nickname?: string;
  position?: Vector3;
  rotation?: Quaternion;
  bodyLength?: number;
  hitBodySize?: Vector3;
}

export interface RemotePlayerHandle {
  rigidBodyRef: React.RefObject<RigidBody>;
  syncState: (state: string, position: Vector3, quaternionRotation?: Quaternion) => void;
}

export const RemotePlayer = forwardRef<RemotePlayerHandle, RemotePlayerProps>(
  ({ account, nickname, position = [0, 0, 0], rotation = [0, 0, 0, 1], bodyLength = 3, hitBodySize = [1, 0.6, 3] }, ref) => {
    const { registerPlayerRef, unregisterPlayerRef } = usePlayerStore();

    const networkObjectRef = useRef<NetworkObjectHandle>(null);
    const currentStateRef = useRef<AircraftState>(AircraftState.IDLE);

    useImperativeHandle(
      ref,
      () => ({
        rigidBodyRef: networkObjectRef.current?.rigidBodyRef,
        syncState: (state: string, position: Vector3 = [0, 0, 0], quaternionRotation: Quaternion = [0, 0, 0, 1]) => {
          currentStateRef.current = (state as AircraftState) || AircraftState.IDLE;

          if (!networkObjectRef.current) return;

          networkObjectRef.current.syncTransform(position, quaternionRotation);
        },
      }),
      [],
    );

    useEffect(() => {
      if (!account || !networkObjectRef.current) return;

      registerPlayerRef(account, networkObjectRef.current.rigidBodyRef);
      return () => {
        unregisterPlayerRef(account);
      };
    }, [account, networkObjectRef.current]);

    useEffect(() => {
      if (!networkObjectRef.current || !networkObjectRef.current.rigidBodyRef.current) return;

      networkObjectRef.current.rigidBodyRef.current.userData = { account };
    }, [networkObjectRef.current]);

    const hitBodySizeVector = toVector3(hitBodySize);

    // Renderer setup
    const nicknameOffsetY = 0.6 + 0.5;

    return (
      <NetworkObject ref={networkObjectRef} position={position} rotation={rotation}>
        <CuboidCollider
          name="REMOTE_PLAYER"
          collisionGroups={interactionGroups(CollisionGroup.RemotePlayer)}
          position={[0, hitBodySizeVector.y / 2, 0]}
          args={[hitBodySizeVector.x / 2, hitBodySizeVector.y / 2, hitBodySizeVector.z / 2]}
          activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_KINEMATIC | ActiveCollisionTypes.KINEMATIC_FIXED}
        />
        <Aircraft bodyLength={bodyLength} />

        {/* Render custom UI (e.g., nickname) */}
        {nickname && (
          <Billboard position={[0, nicknameOffsetY, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text fontSize={0.5} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000">
              {nickname}
            </Text>
          </Billboard>
        )}
      </NetworkObject>
    );
  },
);
