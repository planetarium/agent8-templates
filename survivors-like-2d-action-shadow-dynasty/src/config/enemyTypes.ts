/**
 * Enemy type definitions for Shadow Dynasty.
 * Holy warriors hunting the necromancer.
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
    key: 'crusader',
    displayName: 'Holy Crusader',
    spriteKey: 'crusader',
    animKey: 'crusader_walk',
    size: 56,
    speed: 75,
    hp: 2,
    xpDrop: 1,
    goldChance: 0.2,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'templar',
    displayName: 'Swift Templar',
    spriteKey: 'crusader',
    animKey: 'crusader_walk',
    size: 42,
    speed: 140,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
    tint: 0xffe066,
  },
  {
    key: 'archangel',
    displayName: 'Archangel',
    spriteKey: 'archangel',
    animKey: 'archangel_walk',
    size: 96,
    speed: 38,
    hp: 8,
    xpDrop: 3,
    goldChance: 0.45,
    behavior: 'tank',
    spawnWeight: 3,
    tint: 0xffffff,
  },
];
