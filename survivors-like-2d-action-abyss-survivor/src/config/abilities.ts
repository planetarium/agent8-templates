/**
 * Level-up ability definitions. Design entirely new abilities for your game concept.
 * Effects are applied in MainScene when the player selects an ability.
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
  | { type: 'orbit'; count: number; damage: number }
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
    name: 'Rapid Harpoon',
    description: 'Fire harpoons much faster.',
    icon: 'Zap',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Flippers',
    description: 'Move faster through the deep water.',
    icon: 'Wind',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 30 },
  },
  {
    key: 'health',
    name: 'Oxygen Tank',
    description: 'Gain +1 Max HP and fully heal your diver.',
    icon: 'Heart',
    colorScheme: 'cyan',
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
    name: 'Heavy Harpoon',
    description: 'Your harpoons deal extra damage.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'orbit',
    name: 'Abyssal Pearls',
    description: 'Summon glowing pearls to orbit and damage enemies.',
    icon: 'Sparkles',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'orbit', count: 2, damage: 1 },
  },
  {
    key: 'multishot',
    name: 'Twin Harpoons',
    description: 'Fire two harpoons at once.',
    icon: 'Target',
    colorScheme: 'blue',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Tungsten Tip',
    description: 'Harpoons pierce through multiple enemies.',
    icon: 'Target',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Depth Charge',
    description: 'Enemies explode like a depth charge on death.',
    icon: 'Zap',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 100, damage: 1 },
  },
];
