import { RigidBody } from '@react-three/rapier';

const ROOM_HALF = 11; // half of 22-unit room
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;

/**
 * DungeonRoom — Stone dungeon chamber with 4 solid walls.
 * [CHANGE] Replace wall/floor colors and geometry to match your concept.
 * Walls use RigidBody "fixed" so physics bodies cannot pass through.
 */
const DungeonRoom = () => {
  const wallColor = '#2d2240';
  const wallEmissive = '#1a0f2e';

  return (
    <>
      {/* North wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, WALL_HEIGHT / 2, -ROOM_HALF]} castShadow receiveShadow>
          <boxGeometry args={[ROOM_HALF * 2, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={wallColor} emissive={wallEmissive} emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, WALL_HEIGHT / 2, ROOM_HALF]} castShadow receiveShadow>
          <boxGeometry args={[ROOM_HALF * 2, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={wallColor} emissive={wallEmissive} emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-ROOM_HALF, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_HALF * 2]} />
          <meshStandardMaterial color={wallColor} emissive={wallEmissive} emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* East wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[ROOM_HALF, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_HALF * 2]} />
          <meshStandardMaterial color={wallColor} emissive={wallEmissive} emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Gem-glow torches at corners (point lights for atmosphere) */}
      <pointLight position={[-9, 2, -9]} color="#aa66ff" intensity={8} distance={8} decay={2} />
      <pointLight position={[9, 2, -9]} color="#6688ff" intensity={8} distance={8} decay={2} />
      <pointLight position={[-9, 2, 9]} color="#6688ff" intensity={8} distance={8} decay={2} />
      <pointLight position={[9, 2, 9]} color="#aa66ff" intensity={8} distance={8} decay={2} />
    </>
  );
};

export default DungeonRoom;
