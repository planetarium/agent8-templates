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
    key: 'bug',
    displayName: 'Alien Bug',
    spriteKey: 'bug',
    animKey: 'bug_walk',
    size: 64,
    speed: 90,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'drone',
    displayName: 'Cyber Drone',
    spriteKey: 'drone',
    animKey: 'drone_walk',
    size: 48,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0x88ff88,
  },
  {
    key: 'brute',
    displayName: 'Mech Brute',
    spriteKey: 'brute',
    animKey: 'brute_walk',
    size: 96,
    speed: 50,
    hp: 6,
    xpDrop: 2,
    goldChance: 0.35,
    behavior: 'tank',
    spawnWeight: 3,
    tint: 0xff88ff,
  },
];
