/**
 * Enemy type definitions for Phantom Garden.
 * Three cursed creature species with different behaviors.
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
    key: 'shadowimp',
    displayName: 'Shadow Imp',
    spriteKey: 'imp',
    animKey: 'imp_walk',
    size: 56,
    speed: 75,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'wisp',
    displayName: 'Cursed Wisp',
    spriteKey: 'imp',
    animKey: 'imp_walk',
    size: 42,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0xcc66ff,
  },
  {
    key: 'treant',
    displayName: 'Blighted Treant',
    spriteKey: 'treant',
    animKey: 'treant_walk',
    size: 96,
    speed: 38,
    hp: 8,
    xpDrop: 3,
    goldChance: 0.45,
    behavior: 'tank',
    spawnWeight: 3,
    tint: 0x66bb6a,
  },
];
