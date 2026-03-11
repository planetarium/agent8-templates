/**
 * Game metadata, player stats, and UI theme tokens.
 * Shadow Dynasty — Dark Necromancer vs Holy Crusaders concept.
 */

export const GAME_CONFIG = {
  name: 'SHADOW DYNASTY',
  subtitle: 'DYNASTY',

  player: {
    spriteKey: 'necromancer',
    displayName: 'Necromancer',
    speed: 180,
    maxHealth: 3,
    fireRate: 380,
    projectileDamage: 1,
    projectileSpeed: 520,
    projectileSize: 18,
    playerSize: 72,
  },

  ui: {
    accentColor: '#A855F7',
    accentTailwind: 'purple',
    titleGradient: 'from-purple-200 via-purple-400 to-red-600',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-red-950/80',
    levelUpTitle: 'DARK ASCENSION',
    currencyLabel: 'SOULS',
    gameOverTitle: 'BANISHED',
    tryAgainLabel: 'RESURRECT',
    quitConfirmTitle: 'RETREAT TO SHADOWS?',
    quitConfirmMessage:
      'Return to the void? Your harvested souls will be sealed in the blockchain.',
  },

  currency: {
    spriteKey: 'soul',
    displayName: 'Soul Essence',
  },

  projectile: {
    /** Sprite key for player projectiles. Must exist in assets.json images. */
    spriteKey: 'shadowbolt',
  },

  xp: {
    spriteKey: 'bloodrune',
    initialNextLevelXp: 5,
    levelMultiplier: 1.5,
  },
};

export type GameConfig = typeof GAME_CONFIG;
