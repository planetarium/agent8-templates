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
  { wave: 1, spawnInterval: 2000, maxConcurrentEnemies: 8 },
  { wave: 2, spawnInterval: 1800, maxConcurrentEnemies: 10 },
  { wave: 3, spawnInterval: 1500, maxConcurrentEnemies: 15 },
  { wave: 4, spawnInterval: 1400, maxConcurrentEnemies: 18 },
  {
    wave: 5,
    spawnInterval: 1200,
    maxConcurrentEnemies: 22,
    enemyWeightOverrides: { crab: 8 },
  },
  { wave: 6, spawnInterval: 1100, maxConcurrentEnemies: 25 },
  {
    wave: 7,
    spawnInterval: 1000,
    maxConcurrentEnemies: 28,
    enemyWeightOverrides: { angler: 12 },
  },
  { wave: 8, spawnInterval: 900, maxConcurrentEnemies: 32 },
  {
    wave: 9,
    spawnInterval: 800,
    maxConcurrentEnemies: 36,
    enemyWeightOverrides: { crab: 10, angler: 10 },
  },
  { wave: 10, spawnInterval: 700, maxConcurrentEnemies: 40 },
];
