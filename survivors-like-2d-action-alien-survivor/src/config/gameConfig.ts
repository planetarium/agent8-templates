/**
 * Game metadata, player stats, and UI theme tokens.
 * Alien Survivor — Space Marine vs Alien Hordes concept.
 */

export const GAME_CONFIG = {
  name: 'ALIEN SURVIVOR',
  subtitle: 'SURVIVOR',

  player: {
    spriteKey: 'marine',
    displayName: 'Space Marine',
    speed: 180,
    maxHealth: 3,
    fireRate: 380,
    projectileDamage: 1,
    projectileSpeed: 520,
    projectileSize: 18,
    playerSize: 72,
  },

  ui: {
    accentColor: '#22D3EE',
    accentTailwind: 'cyan',
    titleGradient: 'from-cyan-200 via-blue-300 to-purple-500',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-purple-950/80',
    levelUpTitle: 'UPGRADE!',
    currencyLabel: 'CREDITS',
    gameOverTitle: 'ELIMINATED',
    tryAgainLabel: 'REDEPLOY',
    quitConfirmTitle: 'ABORT MISSION?',
    quitConfirmMessage:
      'Return to base? Your earned space credits will be saved to the blockchain.',
  },

  currency: {
    spriteKey: 'credit',
    displayName: 'Space Credits',
  },

  projectile: {
    /** Sprite key for player projectiles. Must exist in assets.json images. */
    spriteKey: 'plasma',
  },

  xp: {
    spriteKey: 'crystal',
    initialNextLevelXp: 5,
    levelMultiplier: 1.5,
  },
};

export type GameConfig = typeof GAME_CONFIG;
