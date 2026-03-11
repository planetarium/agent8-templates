/**
 * Level-up ability definitions for Alien Survivor.
 * Space marine upgrades and weapon enhancements.
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
    name: 'Rapid Fire',
    description: 'Overclock your plasma rifle for faster firing speed.',
    icon: 'Zap',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Jetboost',
    description: 'Activate thruster boosters for increased movement speed.',
    icon: 'Sparkles',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 35 },
  },
  {
    key: 'health',
    name: 'Nano Repair',
    description: 'Nanobots repair your armor — +1 Max Shield and full heal.',
    icon: 'Shield',
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
    name: 'Plasma Charge',
    description: 'Supercharge plasma rounds for devastating damage.',
    icon: 'Flame',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Hypervelo',
    description: 'Accelerate plasma bolts to hypersonic velocity.',
    icon: 'Wind',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 90 },
  },
  {
    key: 'multishot',
    name: 'Burst Protocol',
    description: 'Fire twin plasma bolts simultaneously.',
    icon: 'Target',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Ion Lance',
    description: 'Ion-charged bolts pierce through alien flesh.',
    icon: 'Crosshair',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Nova Blast',
    description: 'Enemies explode in a nova burst on death.',
    icon: 'Bomb',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 130, damage: 1 },
  },
];
