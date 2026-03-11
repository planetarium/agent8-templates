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
    key: 'croissant',
    displayName: 'Moldy Croissant',
    spriteKey: 'croissant',
    animKey: 'croissant_walk',
    size: 64,
    speed: 90,
    hp: 3,
    xpDrop: 1,
    goldChance: 0.25,
    behavior: 'chase',
    spawnWeight: 10,
  },
  {
    key: 'doughnut',
    displayName: 'Slime Doughnut',
    spriteKey: 'doughnut',
    animKey: 'doughnut_walk',
    size: 48,
    speed: 150,
    hp: 1,
    xpDrop: 1,
    goldChance: 0.15,
    behavior: 'swarm',
    spawnWeight: 6,
  },
  {
    key: 'baguette',
    displayName: 'Burnt Baguette',
    spriteKey: 'baguette',
    animKey: 'baguette_walk',
    size: 100,
    speed: 50,
    hp: 10,
    xpDrop: 3,
    goldChance: 0.4,
    behavior: 'tank',
    spawnWeight: 3,
  },
];