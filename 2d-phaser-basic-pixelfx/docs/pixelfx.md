# pixelfx — pixel art effects for this game

This project ships with [`pixelfx`](https://github.com/patch-gg/pixelfx) (MIT), a library of **244 code-drawn pixel art
effects**: fire, explosions, magic, weather, hits, slashes, pickups, UI pops, status auras and more. No image files —
every effect is a small JS module that draws itself.

**When the user asks for any visual effect (explosion, heal, hit, slash, sparkle, rain, magic, level-up...), use a
pixelfx effect first.** Only hand-roll Phaser particles or tweens when nothing in the list below fits.

## Quick start (use the helper)

`src/game/pixelfx/PixelFxLayer.ts` already wires pixelfx into Phaser. Create one layer per scene and play effects at
world coordinates:

```ts
import Phaser from 'phaser';
import { PixelFxLayer } from '../pixelfx/PixelFxLayer';
import * as bigExplosion from 'pixelfx/fx/explosions/big-explosion';
import * as heal from 'pixelfx/fx/holy/heal';

export class MainScene extends Phaser.Scene {
  private fx!: PixelFxLayer;

  create() {
    // pixelScale 3: one effect pixel = 3x3 screen pixels. depth puts it above your sprites.
    this.fx = new PixelFxLayer(this, { pixelScale: 3, depth: 1000 });
  }

  onBossDefeated(boss: Phaser.GameObjects.Sprite) {
    // x, y = where the effect stands: the ground point under it (feet of a character, bottom of a blast)
    this.fx.play(bigExplosion, { x: boss.x, y: boss.y + boss.displayHeight / 2 });
  }

  onHeal(player: Phaser.GameObjects.Sprite) {
    // follow: the effect moves with the sprite; x / y become offsets from it
    this.fx.play(heal, { follow: player, x: 0, y: player.displayHeight / 2 });
  }
}
```

- `play(module, options)` returns a handle: `handle.stop()` (loops fade out, one-shots end early),
  `handle.setPosition(x, y)`, `handle.done`.
- **One-shots remove themselves** when they finish. **Loops** (fire, weather, auras, pickups) run until you call
  `handle.stop()` — keep the handle.
- The layer is fixed to the camera and converts world coordinates using the camera scroll. Camera zoom is not applied.
- Pass `backDepth` to split an effect into the part behind your character and the part in front:
  `new PixelFxLayer(this, { pixelScale: 3, depth: 1000, backDepth: -1 })`.
- Effects scale only by `pixelScale` (whole numbers). Choose it so the effect fits your sprites: character-sized
  effects are built around a ~24×38 pixel character, so with `pixelScale: 3` they suit a ~72×114 px sprite.
- Effect modules import as namespaces: `import * as name from 'pixelfx/fx/<category>/<effect>'`.

### Options

Every effect takes these (plus its own extra options):

| option | what it does |
|---|---|
| `x`, `y` | world position in game pixels (the effect's ground/anchor point) |
| `follow` | a sprite (anything with `x`, `y`) to stick to; `x`, `y` become offsets |
| `flip` | `true` mirrors it. Directional effects (slashes, breath, projectiles, muzzle flashes) face **right** by default — flip when the character faces left |
| `angle` | rotation in radians |
| `seed` | number; change it so two copies of the same effect don't look identical |
| `palette` | dark-to-bright array of hex colors to recolor it, e.g. blue fire: `['#102', '#215', '#43a', '#8cf', '#cff', '#fff']` |
| `light` | glow strength (default `1`; `0` = no glow, `2` = brighter) |
| `body` | character effects only: `'hidden'` (default) draws just the effect around your sprite; `'stock'` also paints pixelfx's grey demo dummy |

### Weather / full-screen effects

Weather effects (`weather/*`) are drawn as a 320×180 scene with the anchor at its bottom center. To cover the screen,
give them their own layer behind the game, sized so 320×180 fills it:

```ts
import * as rain from 'pixelfx/fx/weather/rain';

const s = Math.ceil(Math.max(this.scale.width / 320, this.scale.height / 180));
const weather = new PixelFxLayer(this, { pixelScale: s, depth: -10 });
const rainFx = weather.play(rain, { x: this.scale.width / 2, y: this.scale.height - 10 * s });
// later: rainFx.stop();
```

## Raw API (without the helper)

If you need full control (e.g. a separate overlay canvas), this is what `PixelFxLayer` does each frame:

```ts
import { createFrame, clearFrame, createFx, composite } from 'pixelfx';
import * as campfire from 'pixelfx/fx/fire/campfire';

const W = 320, H = 180;                         // your game's pixel resolution
const frame = createFrame(W, H);
const tex = scene.textures.createCanvas('fx', W, H)!;
tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
scene.add.image(0, 0, 'fx').setOrigin(0).setScrollFactor(0).setDisplaySize(W * 3, H * 3);
const imageData = tex.context.createImageData(W, H);
const fire = createFx(campfire, { x: 160, y: 170 }); // x, y in frame pixels here

// every tick (dt in seconds):
fire.update(dt);
clearFrame(frame);
fire.draw(frame, 'back');                       // behind characters ('front' for in front, omit for both)
fire.draw(frame, 'front');
composite(frame, imageData.data, null);         // null = transparent background (or a 0xAABBGGRR color)
tex.context.putImageData(imageData, 0, 0);
tex.refresh();
if (fire.done()) { /* one-shot finished: drop it */ }
```

## ⚠️ Import only the effects you use

Each effect is its own module. Import only the ones the game plays — importing the whole library adds **~456 KB
gzipped** to the bundle. Never `import * from` a category folder or loop over every effect.

## Effect ids by category

Import path: `pixelfx/fx/<id>`. *loop* = runs until you stop it, *one-shot* = plays once and removes itself.
This is a selection; the full list of 244 with descriptions is in
`node_modules/pixelfx/docs/CATALOG.md` (grep it for a keyword, e.g. `grep -i coin node_modules/pixelfx/docs/CATALOG.md`).

| category | ids (type) |
|---|---|
| **explosions** | `explosions/big-explosion` (one-shot, 7.2 s, huge), `explosions/small-explosion`, `explosions/barrel-explosion`, `explosions/cartoon-pow`, `explosions/firework-burst`, `explosions/plasma-explosion` — all one-shot |
| **fire** | `fire/campfire`, `fire/torch`, `fire/brazier`, `fire/fireball`, `fire/flamethrower` (loops), `fire/flame-pillar` (one-shot) |
| **melee** (attacker at x,y, faces right) | `melee/sword-slash`, `melee/double-slash`, `melee/heavy-cleave`, `melee/spin-slash`, `melee/claw-swipe`, `melee/hammer-smash` — all one-shot |
| **impacts** | `impacts/hit-spark`, `impacts/blunt-hit`, `impacts/crit-hit`, `impacts/hit-flash`, `impacts/ground-slam`, `impacts/shield-block` — all one-shot |
| **projectiles** (face right) | `projectiles/arrow`, `projectiles/laser-bolt`, `projectiles/plasma-shot`, `projectiles/rocket` (loops), `projectiles/magic-missile`, `projectiles/muzzle-pistol` (one-shot) |
| **holy / healing** | `holy/heal`, `holy/heal-aoe`, `holy/resurrection`, `holy/feather-burst` (one-shot), `holy/halo`, `holy/divine-shield` (loops) |
| **arcane** | `arcane/mana-burst`, `arcane/blink-in`, `arcane/blink-out`, `arcane/star-fall` (one-shot), `arcane/portal`, `arcane/spell-charge` (loops) |
| **shadow** | `shadow/dark-explosion`, `shadow/curse`, `shadow/life-steal` (one-shot), `shadow/black-hole`, `shadow/void-orb`, `shadow/shadow-flames` (loops) |
| **ice** | `ice/frost-nova`, `ice/freeze`, `ice/ice-shatter`, `ice/snowflake-burst`, `ice/icicle-fall` (one-shot), `ice/ice-crystal` (loop) |
| **lightning** | `lightning/lightning-strike`, `lightning/zap-hit`, `lightning/chain-lightning`, `lightning/thunderclap` (one-shot), `lightning/electrified`, `lightning/plasma-ball` (loops) |
| **water** | `water/splash`, `water/wave-crash` (one-shot), `water/bubbles`, `water/fountain`, `water/waterfall`, `water/ripples` (loops) |
| **nature** | `nature/healing-bloom`, `nature/acid-splash`, `nature/earth-spike`, `nature/thorns` (one-shot), `nature/poison-cloud`, `nature/tornado` (loops) |
| **sci-fi** | `scifi/emp-blast`, `scifi/warp-in`, `scifi/warp-out` (one-shot), `scifi/force-field`, `scifi/teleporter-pad`, `scifi/energy-core` (loops) |
| **status** (loop on a character) | `status/burning`, `status/poisoned`, `status/stunned`, `status/frozen`, `status/haste`, `status/sleep` |
| **weather** (all loops, see above) | `weather/rain`, `weather/snow`, `weather/storm`, `weather/fog`, `weather/falling-leaves`, `weather/cherry-blossoms`, `weather/fireflies` |
| **pickups** | `pickups/collect-burst`, `pickups/chest-open` (one-shot), `pickups/coin-spin`, `pickups/gem-spin`, `pickups/heart-pickup`, `pickups/power-star` (loops) |
| **ui** (all one-shot) | `ui/coin-collect`, `ui/level-up`, `ui/damage-number`, `ui/crit-number`, `ui/confetti`, `ui/achievement` |
| **spawn & death** (one-shot) | `spawn/poof`, `spawn/coin-drop`, `spawn/disintegrate`, `spawn/soul-rise`, `spawn/spawn-portal`, `spawn/shatter-death` |
| **transitions** (one-shot, screen-sized: use a layer like weather) | `transitions/iris`, `transitions/diamond-wipe`, `transitions/pixel-dissolve`, `transitions/burn-away`, `transitions/slash-wipe` |
| **critters** (loops) | `critters/bat`, `critters/bird`, `critters/butterfly`, `critters/slime`, `critters/ghost`, `critters/wisp` |
| **moves** (one-shot, full attack with pixelfx's own demo character) | `moves/sword-combo`, `moves/fireball-throw`, `moves/meteor-call`, `moves/lightning-call` — these draw their own stick-figure attacker; prefer the single effects above for your own characters |

### Common requests

| request | effect |
|---|---|
| boss / enemy dies with a big explosion | `explosions/big-explosion` (or `explosions/small-explosion` for normal enemies) |
| heal skill | `holy/heal` on the character (`follow`), `holy/heal-aoe` for area heals |
| coin / item pickup sparkle | `pickups/collect-burst`, or `ui/coin-collect` for a coin counter pop |
| rain / snow in the background | `weather/rain`, `weather/snow` on a full-screen layer behind the game |
| sword hit | `melee/sword-slash` at the attacker (flip when facing left) + `impacts/hit-spark` on the target |

## Gotchas

- Character effects (heal, status, melee, freeze...) are shaped around a 24×38 px stand-in. With the default
  `body: 'hidden'` the stand-in is not drawn, but a few effects (`status/frozen`, `ice/freeze`, `spawn/*`) still
  draw an outline or block in its shape. Prefer aura-style effects for your own sprites, or tint the sprite with
  Phaser instead.
- `big-explosion` is 360×300 effect pixels (≈1080×900 on screen at `pixelScale: 3`). Use `pixelScale: 2` or
  `small-explosion` if it is too big.
- Do not modify files in `node_modules/pixelfx`. Recolor with `palette` instead.
