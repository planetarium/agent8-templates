/**
 * Level-up ability definitions for Shadow Dynasty.
 * Dark necromantic powers and forbidden magic.
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
    name: 'Soul Frenzy',
    description: 'Channel dark energy faster, unleashing shadow bolts at blinding speed.',
    icon: 'Zap',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Wraith Step',
    description: 'Phase through the shadow realm to move with unnatural swiftness.',
    icon: 'Sparkles',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 35 },
  },
  {
    key: 'health',
    name: 'Blood Pact',
    description: 'Forge a pact with darkness — +1 Soul Ward and full restoration.',
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
    name: 'Void Infusion',
    description: 'Infuse shadow bolts with void energy for devastating destruction.',
    icon: 'Flame',
    colorScheme: 'red',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Dark Velocity',
    description: 'Accelerate shadow bolts through dimensional rifts.',
    icon: 'Wind',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 90 },
  },
  {
    key: 'multishot',
    name: 'Twin Shadows',
    description: 'Split your dark energy to fire twin shadow bolts.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Phantom Lance',
    description: 'Shadow bolts phase through flesh, piercing multiple foes.',
    icon: 'Crosshair',
    colorScheme: 'purple',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Death Nova',
    description: 'Slain enemies erupt in a necrotic explosion.',
    icon: 'Bomb',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 130, damage: 1 },
  },
];
