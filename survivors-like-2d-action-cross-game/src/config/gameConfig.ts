/**
 * Game metadata, player stats, and UI theme tokens.
 * Modify this file when creating a new game concept.
 */

export const GAME_CONFIG = {
  name: 'NEON STRIKERS',
  subtitle: 'STRIKERS',

  player: {
    spriteKey: 'player',
    displayName: 'Marine',
    speed: 200,
    maxHealth: 3,
    fireRate: 300,
    projectileDamage: 1,
    projectileSpeed: 600,
    projectileSize: 20,
    playerSize: 80,
  },

  ui: {
    accentColor: '#06b6d4',
    accentTailwind: 'cyan',
    titleGradient: 'from-cyan-300 via-purple-400 to-pink-600',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-black/90',
    levelUpTitle: 'SYSTEM UPGRADE',
    currencyLabel: 'CREDITS',
    gameOverTitle: 'SIGNAL LOST',
    tryAgainLabel: 'REBOOT',
    quitConfirmTitle: 'ABORT MISSION?',
    quitConfirmMessage:
      'Are you sure you want to return to the main menu? Your session progress will be finalized.',
  },

  currency: {
    spriteKey: 'coin',
    displayName: 'Gold',
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
