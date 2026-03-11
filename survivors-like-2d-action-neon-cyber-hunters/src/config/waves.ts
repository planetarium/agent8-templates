/**
 * Wave progression design. Define how difficulty scales across waves.
 */

export interface WaveConfig {
  wave: number;
  spawnInterval: number;
  maxConcurrentEnemies: number;
  enemyWeightOverrides?: Record<string, number>;
  bossType?: string;
}

export const WAVE_DURATION_MS = 60_000;

export const WAVES: WaveConfig[] = [
  { wave: 1, spawnInterval: 1800, maxConcurrentEnemies: 8 },
  { wave: 2, spawnInterval: 1600, maxConcurrentEnemies: 12 },
  { wave: 3, spawnInterval: 1400, maxConcurrentEnemies: 16, enemyWeightOverrides: { spider: 5 } },
  { wave: 4, spawnInterval: 1200, maxConcurrentEnemies: 20 },
  {
    wave: 5,
    spawnInterval: 1000,
    maxConcurrentEnemies: 25,
    enemyWeightOverrides: { beast: 5 },
  },
  { wave: 6, spawnInterval: 900, maxConcurrentEnemies: 30, enemyWeightOverrides: { spider: 10 } },
  {
    wave: 7,
    spawnInterval: 800,
    maxConcurrentEnemies: 35,
    enemyWeightOverrides: { drone: 15 },
  },
  { wave: 8, spawnInterval: 750, maxConcurrentEnemies: 40, enemyWeightOverrides: { beast: 8 } },
  {
    wave: 9,
    spawnInterval: 700,
    maxConcurrentEnemies: 45,
    enemyWeightOverrides: { beast: 10, spider: 10 },
  },
  { wave: 10, spawnInterval: 600, maxConcurrentEnemies: 50 },
];
