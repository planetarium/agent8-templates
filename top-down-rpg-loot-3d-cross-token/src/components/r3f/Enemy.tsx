import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
import { useLocalPlayerStore } from '../../stores/localPlayerStore';
import { useGameStore, EnemyData } from '../../stores/gameStore';
import { enemyPositionRegistry } from '../../utils/enemyPositionRegistry';

interface EnemyProps {
  enemy: EnemyData;
}

const ROOM_BOUNDS = 9.5; // slightly inside wall

/**
 * Enemy — 3D NPC that chases the player.
 * Uses a dynamic RigidBody for physics-based movement via setLinvel().
 * Updates enemyPositionRegistry each frame for player's melee hit detection.
 * [CHANGE] Replace capsule geometry with actual character model + animations.
 */
const Enemy: React.FC<EnemyProps> = ({ enemy }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { state: playerState } = useLocalPlayerStore();
  const { damageEnemy, killEnemy } = useGameStore.getState();

  // Register/unregister in position registry
  useEffect(() => {
    return () => {
      enemyPositionRegistry.delete(enemy.id);
    };
  }, [enemy.id]);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const pos = rigidBodyRef.current.translation();
    const playerPos = playerState.position;

    // Update position registry (used by Player for attack detection)
    enemyPositionRegistry.set(enemy.id, new THREE.Vector3(pos.x, pos.y, pos.z));

    // Chase player
    const dx = playerPos.x - pos.x;
    const dz = playerPos.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.6) {
      const nx = dx / dist;
      const nz = dz / dist;
      rigidBodyRef.current.setLinvel(
        { x: nx * enemy.speed, y: rigidBodyRef.current.linvel().y, z: nz * enemy.speed },
        true,
      );
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
    }

    // Clamp inside room bounds (safety)
    if (Math.abs(pos.x) > ROOM_BOUNDS || Math.abs(pos.z) > ROOM_BOUNDS) {
      const cx = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, pos.x));
      const cz = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, pos.z));
      rigidBodyRef.current.setTranslation({ x: cx, y: pos.y, z: cz }, true);
    }
  });

  const hpPercent = enemy.hp / enemy.maxHp;
  const scale = enemy.size / 1.4; // normalize to skeleton size = 1

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders="capsule"
      position={enemy.spawnPosition}
      lockRotations={true}
      userData={{ type: 'ENEMY', enemyId: enemy.id }}
    >
      <group scale={scale}>
        {/* Body */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.35, 0.7, 4, 8]} />
          <meshStandardMaterial color={enemy.color} roughness={0.7} metalness={0.2} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.28, 8, 8]} />
          <meshStandardMaterial color={enemy.color} roughness={0.5} />
        </mesh>

        {/* Eyes (glowing red) */}
        <mesh position={[-0.1, 1.45, 0.24]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.1, 1.45, 0.24]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>

        {/* HP bar — 3D mesh above enemy */}
        <group position={[0, 2.0, 0]}>
          {/* Background */}
          <mesh>
            <boxGeometry args={[0.8, 0.08, 0.01]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Fill */}
          <mesh position={[-(0.8 * (1 - hpPercent)) / 2, 0, 0.01]}>
            <boxGeometry args={[0.8 * hpPercent, 0.08, 0.01]} />
            <meshBasicMaterial color={hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffaa00' : '#ff2222'} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
};

export default Enemy;
