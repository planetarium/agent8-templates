/**
 * Enemy type definitions for Alien Survivor.
 * Three alien species with different behaviors and difficulty levels.
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
    key: 'crawler',
    displayName: 'Alien Crawler',
    spriteKey: 'alien',
    animKey: 'alien_walk',
    size: 56,
    speed: 75,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'skitter',
    displayName: 'Skitter',
    spriteKey: 'alien',
    animKey: 'alien_walk',
    size: 42,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0x88ffaa,
  },
  {
    key: 'brute',
    displayName: 'Alien Brute',
    spriteKey: 'alien_boss',
    animKey: 'alien_boss_walk',
    size: 96,
    speed: 38,
    hp: 8,
    xpDrop: 3,
    goldChance: 0.45,
    behavior: 'tank',
    spawnWeight: 3,
    tint: 0xcc44ff,
  },
];
