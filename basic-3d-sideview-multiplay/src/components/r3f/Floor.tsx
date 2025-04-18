import { useRef, useState, useEffect } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// Seed-based random number generator class
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate random number between 0~1 (replaces Math.random())
  public random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate random number between min~max
  public randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
}

export const Floor = () => {
  // Set default seed value (can be shared via network later)
  const [seed, setSeed] = useState<number>(12345);
  const [rng, setRng] = useState<SeededRandom | null>(null);

  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);
  const circleRef = useRef<Mesh>(null);

  // Initialize RNG
  useEffect(() => {
    setRng(new SeededRandom(seed));
  }, [seed]);

  // State variables for click effect
  const [clickEffect, setClickEffect] = useState(false);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [effectScale, setEffectScale] = useState(1);
  const effectRingRef = useRef<Mesh>(null);

  // Click effect animation
  useFrame(() => {
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Slower shrinking rate
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // Scale the ring
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }
  });

  // Generate Mario-style floor blocks
  const renderFloorBlocks = () => {
    if (!rng) return [];

    // Initialize random generator (ensures same sequence every time)
    const blockRng = new SeededRandom(seed);

    // Set block size and count
    const blockWidth = 4;
    const blockDepth = 2;
    const blockHeight = 0.5;
    const totalBlocks = 15;
    const blocks = [];

    let currentXPosition = -40; // Starting position

    for (let i = 0; i < totalBlocks; i++) {
      // Some blocks have different heights for more varied terrain (using seeded RNG instead of Math.random)
      const randomHeight = blockRng.randomRange(0.5, 0.8);
      const randomDepth = blockRng.randomRange(1.5, 2.5);

      // Make block widths slightly varied
      const currentBlockWidth = blockRng.randomRange(blockWidth, blockWidth + 2);

      // Set random gap between blocks (jumpable distance)
      const gapSize = blockRng.randomRange(2, 4.5); // Random gap between 2~4.5

      // Add random variation to y position
      const randomYOffset = blockRng.randomRange(-0.6, 0.6); // Random height variation between -0.6~0.6

      const posX = currentXPosition + currentBlockWidth / 2;
      const posY = -randomHeight / 2 + randomYOffset;

      blocks.push(
        <RigidBody key={i} type="fixed" position={[posX, posY, 0]} colliders={false} collisionGroups={(0x00000004 << 16) | 0x00000003}>
          <CuboidCollider args={[currentBlockWidth / 2, randomHeight / 2, randomDepth / 2]} />
          <mesh receiveShadow>
            <boxGeometry args={[currentBlockWidth, randomHeight, randomDepth]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#4a4a4a' : '#3f3f3f'} />
          </mesh>
        </RigidBody>,
      );

      // Update position for next block (current block width + random gap)
      currentXPosition += currentBlockWidth + gapSize;
    }

    return blocks;
  };

  return (
    <>
      {/* Minimal click effect ring */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* Thinner ring */}
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      {/* Seed change test (will be replaced with network sync later) */}
      {/* <button 
        onClick={() => setSeed(Math.floor(Math.random() * 10000))} 
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        Generate New Terrain
      </button> */}

      {renderFloorBlocks()}
    </>
  );
};
