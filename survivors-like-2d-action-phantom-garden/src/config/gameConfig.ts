/**
 * Game metadata, player stats, and UI theme tokens.
 * Phantom Garden — Forest Spirit vs Cursed Creatures concept.
 */

export const GAME_CONFIG = {
  name: 'PHANTOM GARDEN',
  subtitle: 'GARDEN',

  player: {
    spriteKey: 'spirit',
    displayName: 'Forest Spirit',
    speed: 180,
    maxHealth: 3,
    fireRate: 380,
    projectileDamage: 1,
    projectileSpeed: 520,
    projectileSize: 18,
    playerSize: 72,
  },

  ui: {
    accentColor: '#A78BFA',
    accentTailwind: 'violet',
    titleGradient: 'from-emerald-200 via-violet-300 to-fuchsia-500',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-emerald-950/80',
    levelUpTitle: 'BLOOM!',
    currencyLabel: 'PETALS',
    gameOverTitle: 'WITHERED',
    tryAgainLabel: 'REGROW',
    quitConfirmTitle: 'LEAVE THE GARDEN?',
    quitConfirmMessage:
      'Return to the roots? Your gathered petals will be preserved in the eternal grove.',
  },

  currency: {
    spriteKey: 'petal',
    displayName: 'Enchanted Petals',
  },

  projectile: {
    /** Sprite key for player projectiles. Must exist in assets.json images. */
    spriteKey: 'thornbolt',
  },

  xp: {
    spriteKey: 'essence',
    initialNextLevelXp: 5,
    levelMultiplier: 1.5,
  },
};

export type GameConfig = typeof GAME_CONFIG;
