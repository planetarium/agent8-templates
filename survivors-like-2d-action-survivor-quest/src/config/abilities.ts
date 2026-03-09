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
    name: 'Faster Fire',
    description: 'Increases your shooting speed significantly.',
    icon: 'Zap',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'speed',
    name: 'Swift Boots',
    description: 'Increases your movement speed across the map.',
    icon: 'Sparkles',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 30 },
  },
  {
    key: 'health',
    name: 'Extra Heart',
    description: 'Gain +1 Max HP and fully heal your knight.',
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
    name: 'Power Shot',
    description: 'Your projectiles deal more damage.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 1 },
  },
  {
    key: 'projectileSpeed',
    name: 'Swift Bolt',
    description: 'Projectiles travel faster and hit sooner.',
    icon: 'Wind',
    colorScheme: 'cyan',
    rarity: 'common',
    effect: { type: 'stat', stat: 'projectileSpeed', delta: 80 },
  },
  {
    key: 'multishot',
    name: 'Double Shot',
    description: 'Fire two projectiles at once.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'multishot', count: 2 },
  },
  {
    key: 'pierce',
    name: 'Piercing Shot',
    description: 'Projectiles pass through enemies without being destroyed.',
    icon: 'Target',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'aoe',
    name: 'Explosive Impact',
    description: 'Enemies explode on death, damaging nearby foes.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 120, damage: 1 },
  },
];
