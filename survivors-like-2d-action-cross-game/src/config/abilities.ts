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
    key: 'fireRate',
    name: 'Overclock Blaster',
    description: 'Increases your shooting speed significantly.',
    icon: 'Zap',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Neon Thrusters',
    description: 'Increases your movement speed across the sector.',
    icon: 'Wind',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 30 },
  },
  {
    key: 'health',
    name: 'Armor Plating',
    description: 'Gain +1 Max HP and fully repair systems.',
    icon: 'Shield',
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
    key: 'projectileDamage',
    name: 'Plasma Core',
    description: 'Your laser blasts deal more damage.',
    icon: 'Crosshair',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Hyper Accelerator',
    description: 'Lasers travel faster and hit sooner.',
    icon: 'Zap',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 80 },
  },
  {
    key: 'multishot',
    name: 'Twin Lasers',
    description: 'Fire two plasma beams simultaneously.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Railgun Mod',
    description: 'Lasers pass through enemies, striking multiple targets.',
    icon: 'Crosshair',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Nova Protocol',
    description: 'Enemies detonate on death, melting nearby hostiles.',
    icon: 'Flame',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 120, damage: 1 },
  },
];
