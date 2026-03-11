import { gameEvents } from '../../App';
import { ENEMY_TYPES } from '../../config/enemyTypes';
import type { EnemyType } from '../../config/enemyTypes';
import { WAVES, WAVE_DURATION_MS, type WaveConfig } from '../../config/waves';

/**
 * Manages wave progression. Uses Phaser game time (ms since scene start).
 */
export class WaveSystem {
  private lastWave = 0;

  /**
   * Returns current wave (1-based) from elapsed game time.
   */
  getCurrentWave(gameTimeMs: number): number {
    return Math.floor(gameTimeMs / WAVE_DURATION_MS) + 1;
  }

  getWaveConfig(wave: number): WaveConfig {
    const found = WAVES.find((c) => c.wave >= wave) ?? WAVES[WAVES.length - 1];
    return found;
  }

  getSpawnInterval(wave: number): number {
    return this.getWaveConfig(wave).spawnInterval;
  }

  getMaxConcurrentEnemies(wave: number): number {
    return this.getWaveConfig(wave).maxConcurrentEnemies;
  }

  /**
   * Picks an enemy type by weighted random. Uses base weights from ENEMY_TYPES
   * plus any overrides from the wave config.
   */
  pickEnemyType(wave: number): EnemyType {
    const config = this.getWaveConfig(wave);
    const overrides = config.enemyWeightOverrides ?? {};

    const weights = ENEMY_TYPES.map((et) => ({
      type: et,
      weight: overrides[et.key] ?? et.spawnWeight,
    }));

    const total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;

    for (const { type, weight } of weights) {
      r -= weight;
      if (r <= 0) return type;
    }

    return weights[weights.length - 1].type;
  }

  /**
   * Call from MainScene update. Emits waveChange when wave increases.
   */
  update(gameTimeMs: number): void {
    const current = this.getCurrentWave(gameTimeMs);
    if (current > this.lastWave && this.lastWave > 0) {
      gameEvents.dispatchEvent(
        new CustomEvent('waveChange', { detail: { wave: current } })
      );
    }
    this.lastWave = current;
  }
}
