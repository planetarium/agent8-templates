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
    displayName: 'Abyssal Slime',
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
    key: 'wisp',
    displayName: 'Phantom Wisp',
    spriteKey: 'wisp',
    animKey: 'wisp_walk',
    size: 48,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
  },
  {
    key: 'golem',
    displayName: 'Stone Golem',
    spriteKey: 'golem',
    animKey: 'golem_walk',
    size: 100,
    speed: 35,
    hp: 8,
    xpDrop: 3,
    goldChance: 0.4,
    behavior: 'tank',
    spawnWeight: 3,
  },
];
