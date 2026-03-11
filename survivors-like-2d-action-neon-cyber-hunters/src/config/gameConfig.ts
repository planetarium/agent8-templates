/**
 * Game metadata, player stats, and UI theme tokens.
 * Modify this file when creating a new game concept.
 */

export const GAME_CONFIG = {
  name: 'NEON CYBER HUNTERS',
  subtitle: 'CYBER HUNTERS',

  player: {
    spriteKey: 'hunter',
    displayName: 'Hunter',
    speed: 220,
    maxHealth: 5,
    fireRate: 350,
    projectileDamage: 1,
    projectileSpeed: 600,
    projectileSize: 24,
    playerSize: 90,
  },

  ui: {
    accentColor: '#00F0FF',
    accentTailwind: 'cyan',
    titleGradient: 'from-cyan-400 via-purple-500 to-pink-500',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-black/90',
    levelUpTitle: 'UPGRADE ACQUIRED!',
    currencyLabel: 'CORES',
    gameOverTitle: 'SYSTEM FAILURE',
    tryAgainLabel: 'REBOOT',
    quitConfirmTitle: 'ABORT MISSION?',
    quitConfirmMessage:
      'Are you sure you want to disconnect? All unsaved neural progress will be lost.',
  },

  currency: {
    spriteKey: 'coin',
    displayName: 'Energy Core',
  },

  projectile: {
    spriteKey: 'projectile',
  },

  xp: {
    spriteKey: 'gem',
    initialNextLevelXp: 10,
    levelMultiplier: 1.4,
  },
};

export type GameConfig = typeof GAME_CONFIG;
