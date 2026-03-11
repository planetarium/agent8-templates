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
    key: 'overclock',
    name: 'Overclock',
    description: 'Bypass safety limits to increase firing rate.',
    icon: 'Zap',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -70 },
  },
  {
    key: 'nitro',
    name: 'Nitro Boost',
    description: 'Enhance leg servos for faster movement.',
    icon: 'Sparkles',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 40 },
  },
  {
    key: 'nano_repair',
    name: 'Nano Repair',
    description: 'Deploy repair drones to increase max integrity.',
    icon: 'Heart',
    colorScheme: 'red',
    rarity: 'common',
    effect: {
      type: 'stat',
      stat: 'maxHealth',
      delta: 1,
      fullHealOnPick: true,
    },
  },
  {
    key: 'plasma_core',
    name: 'Plasma Core',
    description: 'Highly concentrated energy dealing more damage.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1.5 },
  },
  {
    key: 'hyper_rail',
    name: 'Hyper Rail',
    description: 'Accelerate projectiles to extreme velocities.',
    icon: 'Wind',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 100 },
  },
  {
    key: 'split_shot',
    name: 'Split Shot',
    description: 'Divide output to fire multiple pulses.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'multishot', count: 1 },
  },
  {
    key: 'beam_pierce',
    name: 'Beam Pierce',
    description: 'Pulses pass through all digital resistance.',
    icon: 'Target',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'glitch_wave',
    name: 'Glitch Wave',
    description: 'Defeated enemies release a corruptive AoE wave.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 150, damage: 2 },
  },
];
