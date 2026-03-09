/**
 * Game metadata, player stats, and UI theme tokens.
 * Modify this file when creating a new game concept.
 */

export const GAME_CONFIG = {
  name: 'SURVIVOR QUEST',
  subtitle: 'QUEST',

  player: {
    spriteKey: 'knight',
    displayName: 'Knight',
    speed: 180,
    maxHealth: 3,
    fireRate: 400,
    projectileDamage: 1,
    projectileSpeed: 500,
    projectileSize: 20,
    playerSize: 80,
  },

  ui: {
    accentColor: '#FBBF24',
    accentTailwind: 'yellow',
    titleGradient: 'from-white via-gray-200 to-gray-500',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-red-950/80',
    levelUpTitle: 'LEVEL UP!',
    currencyLabel: 'GOLD',
    gameOverTitle: 'GAME OVER',
    tryAgainLabel: 'TRY AGAIN',
    quitConfirmTitle: 'QUIT GAME?',
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
