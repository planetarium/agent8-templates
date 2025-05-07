import { useState, useEffect, useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Seed-based random number generator class
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate random number between 0~1 (replacement for Math.random())
  public random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate random number between min~max
  public randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
}

const Floor = ({ seed = 12345 }: { seed?: number }) => {
  const [rng, setRng] = useState<SeededRandom | null>(null);

  useEffect(() => {
    setRng(new SeededRandom(seed));
  }, [seed]);

  // Generate Mario-style floor blocks
  const renderFloorBlocks = useMemo(() => {
    if (!rng) return [];

    // Block size and count settings
    const blockWidth = 4;
    const totalBlocks = 15;
    const blocks = [];

    // Add floor block at character origin (0,0,0) (to prevent character from falling at start)
    const initialBlockWidth = 6; // Initial block is set wider
    const initialBlockHeight = 0.8;
    const initialBlockDepth = 2;

    blocks.push(
      <RigidBody key="initial-block" type="fixed" position={[0, -initialBlockHeight / 2, 0]} colliders={false}>
        <CuboidCollider args={[initialBlockWidth / 2, initialBlockHeight / 2, initialBlockDepth / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[initialBlockWidth, initialBlockHeight, initialBlockDepth]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>,
    );

    // Generate remaining blocks - starting position slightly to the right of origin
    let currentXPosition = initialBlockWidth / 2 + 2; // Start from a position slightly away from the end of the first block

    for (let i = 0; i < totalBlocks; i++) {
      // Set different heights for some blocks to create more diverse terrain (using seed-based rng instead of Math.random)
      const randomHeight = rng.randomRange(0.5, 0.8);
      const randomDepth = rng.randomRange(1.5, 2.5);

      // Vary block width slightly
      const currentBlockWidth = rng.randomRange(blockWidth, blockWidth + 2);

      // Set random gap between blocks (jumpable distance)
      const gapSize = rng.randomRange(2, 4.5); // Random gap between 2~4.5

      // Add random variation to y position
      const randomYOffset = rng.randomRange(-0.6, 0.6); // Random height change between -0.6~0.6

      const posX = currentXPosition + currentBlockWidth / 2;
      const posY = -randomHeight / 2 + randomYOffset;

      blocks.push(
        <RigidBody key={i} type="fixed" position={[posX, posY, 0]} colliders={false}>
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

    // Add some blocks to the left of origin as well
    currentXPosition = -(initialBlockWidth / 2 + 2); // Position slightly away from the left end of initial block

    for (let i = 0; i < 5; i++) {
      // Only create 5 blocks to the left
      const randomHeight = rng.randomRange(0.5, 0.8);
      const randomDepth = rng.randomRange(1.5, 2.5);
      const currentBlockWidth = rng.randomRange(blockWidth, blockWidth + 2);
      const gapSize = rng.randomRange(2, 4.5);
      const randomYOffset = rng.randomRange(-0.6, 0.6);

      // Calculate block position to the left
      currentXPosition -= currentBlockWidth + gapSize;
      const posX = currentXPosition;
      const posY = -randomHeight / 2 + randomYOffset;

      blocks.push(
        <RigidBody key={`left-${i}`} type="fixed" position={[posX, posY, 0]} colliders={false}>
          <CuboidCollider args={[currentBlockWidth / 2, randomHeight / 2, randomDepth / 2]} />
          <mesh receiveShadow>
            <boxGeometry args={[currentBlockWidth, randomHeight, randomDepth]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#4a4a4a' : '#3f3f3f'} />
          </mesh>
        </RigidBody>,
      );
    }

    return blocks;
  }, [rng]);

  return <>{renderFloorBlocks}</>;
};

export default Floor;
