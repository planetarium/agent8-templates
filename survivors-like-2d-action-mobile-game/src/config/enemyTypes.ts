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
    key: 'slime',
    displayName: 'Slime',
    spriteKey: 'slime',
    animKey: 'slime_walk',
    size: 64,
    speed: 70,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'slime_fast',
    displayName: 'Swift Slime',
    spriteKey: 'slime',
    animKey: 'slime_walk',
    size: 48,
    speed: 130,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0x88ff88,
  },
  {
    key: 'slime_tank',
    displayName: 'Heavy Slime',
    spriteKey: 'slime',
    animKey: 'slime_walk',
    size: 96,
    speed: 40,
    hp: 6,
    xpDrop: 2,
    goldChance: 0.35,
    behavior: 'tank',
    spawnWeight: 3,
    tint: 0x8888ff,
  },
];
