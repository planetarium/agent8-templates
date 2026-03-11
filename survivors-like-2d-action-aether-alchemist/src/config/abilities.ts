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
  | { type: 'aoe'; radius: number; damage: number }
  | { type: 'orbit'; count: number; damage: number };

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
    name: 'Aether Channeling',
    description: 'Increases your casting speed significantly.',
    icon: 'Zap',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Shadow Step',
    description: 'Increases your movement speed across the dark forest.',
    icon: 'Sparkles',
    colorScheme: 'purple',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 30 },
  },
  {
    key: 'health',
    name: 'Elixir of Life',
    description: 'Gain +1 Max HP and fully heal your alchemist.',
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
    key: 'projectileDamage',
    name: 'Arcane Mastery',
    description: 'Your magic orbs deal more damage.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'orbit',
    name: 'Aether Ring',
    description: 'Summons magical orbs that orbit around you.',
    icon: 'RefreshCw',
    colorScheme: 'cyan',
    rarity: 'epic',
    effect: { type: 'orbit', count: 2, damage: 1 },
  },
  {
    key: 'multishot',
    name: 'Dual Cast',
    description: 'Fire two magic orbs at once.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Spectral Penetration',
    description: 'Projectiles pass through enemies like ghosts.',
    icon: 'Target',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Volatile Concoction',
    description: 'Enemies explode into aether on death.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 120, damage: 1 },
  },
];
