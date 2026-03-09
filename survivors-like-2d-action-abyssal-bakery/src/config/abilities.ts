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
  | { type: 'dough_trap'; slowFactor: number };

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
    key: 'knead_faster',
    name: 'Knead Faster',
    description: 'Increases your throwing speed.',
    icon: 'Zap',
    colorScheme: 'blue',
    rarity: 'common',
    effect: { type: 'stat', stat: 'fireRate', delta: -80 },
  },
  {
    key: 'sugar_rush',
    name: 'Sugar Rush',
    description: 'Increases your movement speed across the kitchen.',
    icon: 'Sparkles',
    colorScheme: 'green',
    rarity: 'common',
    effect: { type: 'stat', stat: 'speed', delta: 40 },
  },
  {
    key: 'hearty_meal',
    name: 'Hearty Meal',
    description: 'Gain +1 Max HP and fully heal.',
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
    key: 'heavy_pin',
    name: 'Heavy Pin',
    description: 'Your rolling pins deal more damage.',
    icon: 'Target',
    colorScheme: 'orange',
    rarity: 'rare',
    effect: { type: 'stat', stat: 'projectileDamage', delta: 2 },
  },
  {
    key: 'flour_dust',
    name: 'Flour Dust',
    description: 'Projectiles pass through enemies like fine flour.',
    icon: 'Target',
    colorScheme: 'cyan',
    rarity: 'rare',
    effect: { type: 'pierce', enabled: true },
  },
  {
    key: 'cherry_bomb',
    name: 'Cherry Bomb',
    description: 'Enemies explode into jam on death, damaging nearby pastries.',
    icon: 'Target',
    colorScheme: 'red',
    rarity: 'epic',
    effect: { type: 'aoe', radius: 150, damage: 2 },
  },
  {
    key: 'sticky_dough',
    name: 'Sticky Dough',
    description: 'Your hits cover enemies in sticky dough, slowing them down permanently.',
    icon: 'Target',
    colorScheme: 'purple',
    rarity: 'epic',
    effect: { type: 'dough_trap', slowFactor: 0.5 },
  }
];