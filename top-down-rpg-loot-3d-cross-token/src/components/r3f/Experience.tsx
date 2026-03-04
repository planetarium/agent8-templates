import { useEffect, useRef } from 'react';
import { Environment } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import Player from './Player';
import Floor from './Floor';
import DungeonRoom from './DungeonRoom';
import Enemy from './Enemy';
import LootGem from './LootGem';

/**
 * Experience — main 3D scene director.
 * Renders Player, DungeonRoom, Enemies, and LootGems.
 * Watches floor changes to detect floor-clear and advance to the next floor.
 * [CHANGE] Adjust lighting, environment, or add more visual elements to match your concept.
 */
const Experience = () => {
  const { gamePhase, floor, enemies, gems, nextFloor, collectGem } = useGameStore();
  const prevEnemyCountRef = useRef(0);
  const floorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect floor clear: all enemies defeated
  useEffect(() => {
    if (gamePhase !== 'playing') {
      prevEnemyCountRef.current = 0;
      return;
    }
    if (enemies.length === 0 && prevEnemyCountRef.current > 0) {
      floorTimerRef.current = setTimeout(() => {
        nextFloor();
      }, 2000);
    }
    prevEnemyCountRef.current = enemies.length;
    return () => {
      if (floorTimerRef.current) {
        clearTimeout(floorTimerRef.current);
        floorTimerRef.current = null;
      }
    };
  }, [enemies.length, gamePhase]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <Environment preset="night" background={false} />
      <DungeonRoom />
      <Floor />
      {gamePhase === 'playing' && <Player />}
      {gamePhase === 'playing' &&
        enemies.map((enemy) => (
          <Enemy key={enemy.id} enemy={enemy} />
        ))}
      {gamePhase === 'playing' &&
        gems.map((gem) => (
          <LootGem key={gem.id} gem={gem} onCollect={collectGem} />
        ))}
    </>
  );
};

export default Experience;
