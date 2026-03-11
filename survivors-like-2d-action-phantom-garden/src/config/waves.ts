/**
 * Wave progression for Phantom Garden.
 * 10 escalating waves of cursed creatures invading the garden.
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
  { wave: 1, spawnInterval: 2200, maxConcurrentEnemies: 8 },
  { wave: 2, spawnInterval: 2000, maxConcurrentEnemies: 10 },
  { wave: 3, spawnInterval: 1700, maxConcurrentEnemies: 14 },
  { wave: 4, spawnInterval: 1500, maxConcurrentEnemies: 18 },
  {
    wave: 5,
    spawnInterval: 1300,
    maxConcurrentEnemies: 22,
    enemyWeightOverrides: { treant: 8 },
  },
  { wave: 6, spawnInterval: 1200, maxConcurrentEnemies: 26 },
  {
    wave: 7,
    spawnInterval: 1100,
    maxConcurrentEnemies: 30,
    enemyWeightOverrides: { wisp: 14 },
  },
  { wave: 8, spawnInterval: 950, maxConcurrentEnemies: 34 },
  {
    wave: 9,
    spawnInterval: 800,
    maxConcurrentEnemies: 38,
    enemyWeightOverrides: { treant: 12, wisp: 12 },
  },
  { wave: 10, spawnInterval: 700, maxConcurrentEnemies: 44 },
];
