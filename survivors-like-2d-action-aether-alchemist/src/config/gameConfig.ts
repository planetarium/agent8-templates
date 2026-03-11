/**
 * Game metadata, player stats, and UI theme tokens.
 * Modify this file when creating a new game concept.
 */

export const GAME_CONFIG = {
  name: 'AETHER ALCHEMIST',
  subtitle: 'SURVIVOR',

  player: {
    spriteKey: 'alchemist',
    displayName: 'Alchemist',
    speed: 180,
    maxHealth: 3,
    fireRate: 400,
    projectileDamage: 1,
    projectileSpeed: 500,
    projectileSize: 20,
    playerSize: 80,
  },

  ui: {
    accentColor: '#9333ea',
    accentTailwind: 'purple',
    titleGradient: 'from-purple-300 via-fuchsia-400 to-indigo-600',
    healthStyle: 'orbs' as const,
    hudPosition: 'bottom' as const,
    gameOverBgClass: 'bg-purple-950/80',
    levelUpTitle: 'ARCANE MASTERY!',
    currencyLabel: 'CRYSTALS',
    gameOverTitle: 'CONSUMED BY THE ABYSS',
    tryAgainLabel: 'BREW AGAIN',
    quitConfirmTitle: 'ABANDON CAULDRON?',
    quitConfirmMessage:
      'Are you sure you want to abandon the forest? Your gathered aether will be finalized.',
  },

  currency: {
    spriteKey: 'crystal',
    displayName: 'Crystals',
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
