/**
 * Game metadata, player stats, and UI theme tokens.
 * Modify this file when creating a new game concept.
 */

export const GAME_CONFIG = {
  name: 'ABYSS SURVIVOR',
  subtitle: 'INTO THE DEEP',

  player: {
    spriteKey: 'diver',
    displayName: 'Deep Diver',
    speed: 150,
    maxHealth: 3,
    fireRate: 450,
    projectileDamage: 1,
    projectileSpeed: 450,
    projectileSize: 24,
    playerSize: 80,
  },

  ui: {
    accentColor: '#00FFFF',
    accentTailwind: 'cyan',
    titleGradient: 'from-blue-400 via-cyan-400 to-teal-500',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-blue-950/90',
    levelUpTitle: 'PRESSURE STABILIZED',
    currencyLabel: 'PEARLS',
    gameOverTitle: 'OXYGEN DEPLETED',
    tryAgainLabel: 'DIVE AGAIN',
    quitConfirmTitle: 'ABORT DIVE?',
    quitConfirmMessage:
      'Are you sure you want to return to the surface? Your session progress will be finalized.',
  },

  currency: {
    spriteKey: 'pearl',
    displayName: 'Abyssal Pearl',
  },

  projectile: {
    /** Sprite key for player projectiles. Must exist in assets.json images. */
    spriteKey: 'projectile',
  },

  xp: {
    spriteKey: 'gem',
    initialNextLevelXp: 5,
    levelMultiplier: 1.5,
  },
};

export type GameConfig = typeof GAME_CONFIG;
