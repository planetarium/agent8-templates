/**
 * Level-up ability definitions for Shadow Ninja: Demon Slayer.
 * Ninja techniques and shadow arts upgrades.
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
    name: 'Swift Hands',
    description: 'Channel shadow chi for rapid shuriken throwing speed.',
    icon: 'Zap',
    colorScheme: 'red',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Shadow Step',
    description: 'Become one with shadows for lightning-fast movement.',
    icon: 'Sparkles',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 35 },
  },
  {
    key: 'health',
    name: 'Healing Scroll',
    description: 'Ancient scroll restores +1 Max HP and fully heals.',
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
    name: 'Cursed Blade',
    description: 'Infuse weapons with dark energy for devastating strikes.',
    icon: 'Flame',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Wind Jutsu',
    description: 'Harness the wind to accelerate shuriken velocity.',
    icon: 'Wind',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 90 },
  },
  {
    key: 'multishot',
    name: 'Shadow Clone',
    description: 'Create shadow clones to throw multiple shurikens at once.',
    icon: 'Target',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Spirit Fang',
    description: 'Spirit-infused shurikens pierce through demon flesh.',
    icon: 'Crosshair',
    colorScheme: 'purple',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Demon Seal',
    description: 'Slain demons explode with purifying energy.',
    icon: 'Bomb',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 130, damage: 1 },
  },
];
