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
    key: 'jellyfish',
    displayName: 'Mutant Jellyfish',
    spriteKey: 'jellyfish',
    animKey: 'jellyfish_walk',
    size: 48,
    speed: 80,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'angler',
    displayName: 'Abyssal Angler',
    spriteKey: 'angler',
    animKey: 'angler_walk',
    size: 64,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0xffaaaa,
  },
  {
    key: 'crab',
    displayName: 'Giant Crab',
    spriteKey: 'crab',
    animKey: 'crab_walk',
    size: 96,
    speed: 40,
    hp: 8,
    xpDrop: 2,
    goldChance: 0.35,
    behavior: 'tank',
    spawnWeight: 3,
  },
];
