/**
 * Enemy type definitions. Add or modify enemy types for your game concept.
 * Each type can have different behavior, stats, and spawn weights.
 */

export type EnemyBehavior = 'chase' | 'charge' | 'ranged' | 'tank' | 'swarm';

export interface EnemyType {
  key: string;
  displayName: string;
  spriteKey: string;
  animKey: string;
  size: number;
  speed: number;
  hp: number;
  xpDrop: number;
  goldChance: number;
  behavior: EnemyBehavior;
  spawnWeight: number;
  tint?: number;
}

export const ENEMY_TYPES: EnemyType[] = [
  {
    key: 'drone',
    displayName: 'Cyber Drone',
    spriteKey: 'drone',
    animKey: 'drone_walk',
    size: 64,
    speed: 150,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'spider',
    displayName: 'Virus Spider',
    spriteKey: 'spider',
    animKey: 'spider_walk',
    size: 48,
    speed: 200,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'swarm',
    spawnWeight: 8,
    tint: 0xcc88ff,
  },
  {
    key: 'beast',
    displayName: 'Glitch Beast',
    spriteKey: 'beast',
    animKey: 'beast_walk',
    size: 110,
    speed: 60,
    hp: 15,
    xpDrop: 5,
    goldChance: 0.7,
    behavior: 'tank',
    spawnWeight: 2,
    tint: 0x88ff88,
  },
];
