/**
 * Game metadata, player stats, and UI theme tokens.
 * Shadow Ninja: Demon Slayer — Dark Japanese fantasy survival.
 */

export const GAME_CONFIG = {
  name: 'SHADOW NINJA',
  subtitle: 'DEMON SLAYER',

  player: {
    spriteKey: 'ninja',
    displayName: 'Shadow Ninja',
    speed: 180,
    maxHealth: 3,
    fireRate: 380,
    projectileDamage: 1,
    projectileSpeed: 520,
    projectileSize: 18,
    playerSize: 72,
  },

  ui: {
    accentColor: '#DC2626',
    accentTailwind: 'red',
    titleGradient: 'from-red-500 via-amber-400 to-red-800',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-red-950/80',
    levelUpTitle: 'ASCEND!',
    currencyLabel: 'DEMON GOLD',
    gameOverTitle: 'FALLEN',
    tryAgainLabel: 'RISE AGAIN',
    quitConfirmTitle: 'RETREAT?',
    quitConfirmMessage:
      'Leave the demon realm? Your collected demon gold will be preserved.',
  },

  currency: {
    spriteKey: 'demon_coin',
    displayName: 'Demon Gold',
  },

  projectile: {
    spriteKey: 'shuriken',
  },

  xp: {
    spriteKey: 'soul_crystal',
    initialNextLevelXp: 5,
    levelMultiplier: 1.5,
  },
};

export type GameConfig = typeof GAME_CONFIG;
