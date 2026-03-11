/**
 * Level-up ability definitions for Phantom Garden.
 * Nature magic upgrades and enchanted enhancements.
 */

export type AbilityEffect =
  | {
      type: 'stat';
      stat:
        | 'speed'
        | 'fireRate'
        | 'maxHealth'
        | 'projectileDamage'
        | 'projectileSpeed';
      delta: number;
      fullHealOnPick?: boolean;
    }
  | { type: 'multishot'; count: number }
  | { type: 'pierce'; enabled: boolean }
  | { type: 'aoe'; radius: number; damage: number };

export interface Ability {
  key: string;
  name: string;
  description: string;
  icon: string;
  colorScheme: string;
  rarity: 'common' | 'rare' | 'epic';
  effect: AbilityEffect;
}

export const ABILITIES: Ability[] = [
  {
    key: 'fireRate',
    name: 'Rapid Bloom',
    description: 'Accelerate thorn growth for faster casting speed.',
    icon: 'Zap',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Windwalk',
    description: 'Channel forest winds to glide faster across the garden.',
    icon: 'Wind',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 35 },
  },
  {
    key: 'health',
    name: 'Nature\'s Embrace',
    description: 'Ancient roots restore your bark armor — +1 max and full heal.',
    icon: 'Heart',
    colorScheme: 'green',
    rarity: 'common',
    effect: {
      type: 'stat',
      stat: 'maxHealth',
      delta: 1,
      fullHealOnPick: true,
    },
  },
  {
    key: 'projectileDamage',
    name: 'Venomthorn',
    description: 'Infuse thorns with deadly nightshade venom.',
    icon: 'Flame',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Gale Shot',
    description: 'Enchant thorns with gale force for swifter flight.',
    icon: 'Sparkles',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 90 },
  },
  {
    key: 'multishot',
    name: 'Twin Thorns',
    description: 'Split your thorn bolt into twin projectiles.',
    icon: 'Target',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Briar Lance',
    description: 'Thorns pierce through cursed creatures without stopping.',
    icon: 'Crosshair',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Spore Burst',
    description: 'Defeated creatures release toxic spore clouds.',
    icon: 'Bomb',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 130, damage: 1 },
  },
];
