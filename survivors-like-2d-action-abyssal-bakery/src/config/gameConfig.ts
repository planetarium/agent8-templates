export const GAME_CONFIG = {
  name: 'ABYSSAL BAKERY',
  subtitle: 'BAKERY',

  player: {
    spriteKey: 'baker',
    displayName: 'Combat Baker',
    speed: 200,
    maxHealth: 5,
    fireRate: 350,
    projectileDamage: 2,
    projectileSpeed: 600,
    projectileSize: 24,
    playerSize: 80,
  },

  ui: {
    accentColor: '#ec4899', // pink-500
    accentTailwind: 'pink',
    titleGradient: 'from-pink-100 via-pink-300 to-pink-600',
    healthStyle: 'hearts' as const,
    hudPosition: 'top' as const,
    gameOverBgClass: 'bg-pink-950/80',
    levelUpTitle: 'RECIPE UPGRADE!',
    currencyLabel: 'MAGIC FLOUR',
    gameOverTitle: 'OVEN BURNED OUT',
    tryAgainLabel: 'BAKE AGAIN',
    quitConfirmTitle: 'CLOSE KITCHEN?',
    quitConfirmMessage:
      'Are you sure you want to stop baking? Your magic flour will be saved.',
  },

  currency: {
    spriteKey: 'magic_flour',
    displayName: 'Magic Flour',
  },

  projectile: {
    spriteKey: 'projectile',
  },

  xp: {
    spriteKey: 'gem',
    initialNextLevelXp: 8,
    levelMultiplier: 1.4,
  },
};

export type GameConfig = typeof GAME_CONFIG;