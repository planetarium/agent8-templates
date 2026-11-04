# Pixel art VFX (PixelVfx)

```ts
import { PixelVfx } from '../vfx/PixelVfx';                       // in src/game/scenes/*.ts
PixelVfx.preload(this, ['hit-spark', 'small-explosion']);          // in preload(): only the effects this scene plays
PixelVfx.play(this, 'hit-spark', enemy.x, enemy.y, { scale: 2 });  // anywhere after: plays standing at x, y
```

`src/game/vfx/PixelVfx.ts` plays 23 pre-rendered pixel art effect sheets (pixelfx, MIT) from the Agent8 asset
library: origin at the sheet's pivot, right fps, loop or one-shot, crisp pixels, cleanup. `play()` returns the sprite:
**one-shots destroy themselves**, **loops** run until you call `sprite.destroy()` (keep the returned sprite).

## Which sheet when

| Moment | Sheet | Note |
|---|---|---|
| Enemy dies / something blows up | `small-explosion`, `cartoon-pow` | `plasma-explosion` for energy or sci-fi |
| Melee or sword hit | `hit-spark` | `crit-hit` for a critical or finishing blow |
| Bullet hits a wall or object | `bullet-impact` |  |
| Attack blocked | `shield-block` |  |
| Item picked up (the moment of pickup) | `collect-burst` |  |
| Collectible lying in the world | `coin-spin`, `gem-spin`, `heart-pickup` | loops; destroy on pickup |
| Coin flies into a HUD counter | `coin-collect` |  |
| Heal / restore HP | `heal` | `follow` the character |
| Level up / reward | `level-up` |  |
| Damage number pops up | `damage-number` |  |
| Alert / surprise over a head | `exclamation` |  |
| Stunned / poisoned status | `stunned`, `poisoned` | loops; `follow` the character |
| Projectile in flight | `fireball`, `fireball-ice` | loops; `flip` when moving left |
| Torch / campfire prop | `torch`, `campfire` | loops |
| Rain over the whole screen | `rain` | full-screen, no x, y |

## Rules

1. Size an effect only with the `scale` option. It is a whole number (1, 2, 3); the pixels stay crisp.
2. Never call `setDisplaySize` / `displayWidth` / `displayHeight` on a PixelVfx sprite. The template's setDisplaySize
   rule does not apply to effects; resizing to a pixel size blurs them and breaks the pivot.
3. `x, y` is where the effect stands: the feet of a character, the bottom of a blast, the contact point of a hit.
4. Glow is baked into alpha, so effects read best over darker backgrounds; over very light ones they look faint.
5. Sheets with impact frames (`hits` in `sheets.ts`) can hit-stop: `{ hitStop: true }` pauses the effect on them,
   `{ hitStop: (ms) => … }` also lets you freeze your game for that long.

Options: `scale`, `depth` (default 1000), `flip` (directional effects face right; flip when facing left),
`follow` (an object; `x, y` become offsets from it, and the effect goes when the object is destroyed), `repeat`
(override loop/one-shot), `hitStop`. Full-screen sheets (`rain`) ignore x, y and cover the camera at any zoom.

## Sheets by category (23)

Size is one frame in px; pivot is the anchor point inside it.

### explosions

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `small-explosion` | A ground blast (explosion, fire, smoke, debris, impact) | 300x240 | 163, one-shot | 150, 196 |
| `cartoon-pow` | A comic-book hit (cartoon, comic, pow, hit, impact, text) | 184x144 | 33, one-shot | 92, 72 |
| `plasma-explosion` | A blue-violet energy blast with no smoke (explosion, plasma, energy, electric, magic, sci-fi) | 224x200 | 52, one-shot | 112, 100 |

### fire

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `fireball` | A fireball flying right (fire, fireball, projectile, magic, directional) | 136x56 | 36, loop | 112, 28 |
| `torch` | A wall torch on an iron bracket (fire, torch, prop, light, wall, dungeon) | 72x120 | 60, loop | 36, 94 |
| `campfire` | Crossed logs on a bed of coals and a lively fire (fire, campfire, prop, light, smoke, ambient) | 128x128 | 90, loop | 64, 112 |
| `fireball-ice` | The fireball recoloured with a cold blue ice ramp (fire, fireball, projectile, magic, directional) | 136x56 | 36, loop | 112, 28 |

### holy

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `heal` | Petals of light bloom under the feet, a hoop of light rises up the body restoring its… (holy, heal, restore, buff, petals, hearts, character) | 80x104 | 58, one-shot | 40, 92 |

### impacts

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `hit-spark` | The everyday hit (impact, hit, spark, combat, directional) | 136x80 | 16, one-shot | 44, 64 |
| `crit-hit` | A critical hit (impact, hit, crit, critical, combat, directional) | 216x136 | 28, one-shot | 84, 106 |
| `bullet-impact` | A bullet hits a wall on the right (impact, bullet, gun, wall, sparks, debris, directional) | 152x100 | 43, one-shot | 116, 84 |
| `shield-block` | A blow is caught on a half-dome of energy in front of the character (impact, block, shield, barrier, energy, ripple, actor) | 148x104 | 34, one-shot | 40, 88 |

### pickups

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `coin-spin` | A thick gold coin turning on its edge (pickup, coin, gold, money) | 56x56 | 48, loop | 28, 48 |
| `collect-burst` | The moment of pickup (pickup, collect, burst, sparkle, reward) | 112x108 | 42, one-shot | 56, 94 |
| `gem-spin` | A brilliant-cut ruby turning on its axis (pickup, gem, jewel, treasure, ruby) | 64x64 | 72, loop | 32, 56 |
| `heart-pickup` | A plump glossy heart hovering over its shadow beats lub-dub (pickup, heart, health, life) | 56x60 | 36, loop | 28, 52 |

### status

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `stunned` | Seeing stars (status, stun, dizzy, daze, stars, birds, debuff) | 60x64 | 60, loop | 30, 56 |
| `poisoned` | Sick to the bone (status, poison, toxic, dot, debuff, sick) | 72x64 | 48, loop | 36, 54 |

### ui

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `damage-number` | A red -27 punches out of a hit spark, white for a frame, arcs up, lands with a squash and… (ui, damage, number, combat, text, hit) | 76x68 | 33, one-shot | 30, 52 |
| `level-up` | Gold gathers at the feet and bursts up as a pillar of light round the hero; rings climb… (ui, level, reward, text, light) | 176x138 | 97, one-shot | 88, 114 |
| `coin-collect` | A coin bursts into a fountain of spinning coins that hang, then zip one by one into a HUD… (ui, coins, pickup, reward, hud, counter) | 176x116 | 75, one-shot | 60, 102 |
| `exclamation` | A bold ! springs up off the hero's head, stretching as it shoots up and squashing as it… (ui, alert, surprise, emote, character) | 84x104 | 43, one-shot | 42, 92 |

### weather

| Name | What | Size | Frames | Pivot |
|---|---|---|---|---|
| `rain` | Slanted rain at four depths (weather, rain, storm, water, ambient) | 320x180 | 64, loop, full-screen | 160, 170 |
