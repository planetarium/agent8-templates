# Pixel art VFX (PixelVfx)

Read this before writing any effect. The effects live in the Agent8 asset library; find them with the resource search,
keep the ones the game plays in `src/game/vfx/effects.ts`, and play them with `src/game/vfx/PixelVfx.ts`.

```ts
// src/game/vfx/effects.ts: search results, url + metadata copied as returned
import type { VfxSheet } from './PixelVfx';
export const EFFECTS = {
  hitSpark: {
    url: 'https://agent8-games.verse8.io/assets/2d/vfx/pixelfx/impacts/hit-spark.png',
    metadata: { fps: 30, loop: false, pivot: [44, 64], frames: 16, frameWidth: 136, frameHeight: 80, sheetWidth: 188,
      sheetHeight: 239, screenSpace: false, gpuBytes: 179728, frameData: 'hit-spark.json', category: 'impacts' },
  },
} satisfies Record<string, VfxSheet>;

// src/game/scenes/*.ts
import { PixelVfx } from '../vfx/PixelVfx';
import { EFFECTS } from '../vfx/effects';
PixelVfx.preload(this, [EFFECTS.hitSpark]);                         // in preload(): only the effects this scene plays
PixelVfx.play(this, EFFECTS.hitSpark, enemy.x, enemy.y, { scale: 2 }); // anywhere after: plays standing at x, y
```

`play()` puts the origin at the sheet's pivot and plays at the sheet's fps, loop or one-shot, with crisp pixels, and
cleans up. It returns the sprite: **one-shots destroy themselves**, **loops** run until you call `sprite.destroy()`
(keep the returned sprite).

## 1. Search first

1. Call `search_resources_vectordb_items` with what the moment looks like plus `pixel art VFX sprite sheet`, in English
   (`sword hit spark pixel art VFX sprite sheet`, `coin pickup sparkle pixel art VFX sprite sheet`). The tool calls its
   results "3D game resources", but it also finds these 2D effects.
2. Pick a result whose `url` ends in `.png` and contains `/vfx/pixelfx/`. Skip the `.json` results (they are a sheet's
   frame data), audio (`.mp3`) and effects from other art styles (`/2d/projects/...`). The description may be cut short:
   judge by the name in the url, `metadata.category` and the description you see.
3. Copy the result's `url` and `metadata` as they are into `src/game/vfx/effects.ts` under a name, and play it by that
   name. Do not retype or shorten the metadata: `PixelVfx` throws an error naming the missing field if `url` or
   `metadata.frameWidth` / `frameHeight` / `pivot` / `frames` / `fps` / `loop` is missing.
4. Search while writing the code. The game never searches at runtime.

## 2. Nothing fits: make it

If the search has no effect that fits, make one: generate it with the image / sprite sheet generation tools if you have
them, or draw it in code (Phaser particles, graphics, tweens). Leave a one-line comment with what you searched, e.g.
`// searched "ice shatter pixel art VFX sprite sheet": no match`.

## What is a sheet, what is code

- **World effects → a searched sheet played with PixelVfx**: hits, explosions, deaths, pickups, heals and buffs,
  status, projectiles, weather. Hand-draw one only when the search has nothing that fits (above).
- **UI feedback and screen effects → code** (tweens, graphics, camera effects): tap glows, ripples, scale bounces,
  floating number text, vignettes, screen flashes, camera shake. Do not force a sheet onto UI.
- They usually go together: a hit = a hit spark sheet + hit stop + camera shake + flash; a pickup = a collect burst
  sheet + floating "+1" text + counter bounce. Do not hand-draw the world part either.
- Skip the sheets only if the **user** asked for a smooth vector, realistic/HD or painted look (or gave art in that
  style), or asked you to draw the effects yourself / leave them out. A style you picked yourself is not a reason.

## What to search for

Add `pixel art VFX sprite sheet` to each search.

| The user asks for | Search for | Add in code |
|---|---|---|
| “punchy”, “impactful”, “satisfying hit”, a sword or punch lands | `sword hit spark`, `critical hit` | a 60–90 ms hit stop (`hitStop` if the sheet has impact frames, else in game code) + camera shake + white flash |
| A bullet or arrow hits | `bullet impact` | camera shake |
| Enemy dies, “pop”, “burst”, “vanish” | `cartoon pow`, `small explosion`, `poof smoke` | `plasma explosion` for energy/sci-fi; camera shake |
| Block, parry | `shield block` | |
| Pick up, “collect”, “sparkle”, “rewarding” | `collect burst sparkle` | floating “+1” text and a HUD counter bounce |
| Coin, gem or heart lying in the world | `spinning coin`, `spinning gem`, `heart pickup` | loops; destroy on pickup |
| Coin flies into a HUD counter | `coin collect` | |
| Heal, “restore”, “magical” buff | `heal` | `follow` the character; HP bar tween |
| Level up, combo | `level up`, `combo counter` | screen flash |
| Stunned, poisoned | `stunned stars`, `poisoned` | loops; `follow` the character |
| Fireball, projectile in flight | `fireball projectile` | loops; `flip` when moving left |
| Torch, campfire | `torch flame`, `campfire` | loops |
| Rain, snow, “weather” | `rain`, `snow`, `rain splash`, `water ripples` | rain/snow are full-screen (no x, y); splashes and ripples on the ground |
| Sound effects | — | not a sheet: use the project's audio tools and sfx path |

## Rules

1. Size an effect only with the `scale` option. It is a whole number (1, 2, 3); the pixels stay crisp.
2. Never call `setDisplaySize` / `displayWidth` / `displayHeight` on a PixelVfx sprite. The template's setDisplaySize
   rule does not apply to effects; resizing to a pixel size blurs them and breaks the pivot.
3. `x, y` is where the effect stands: the feet of a character, the bottom of a blast, the contact point of a hit.
4. Glow is baked into alpha, so effects read best over darker backgrounds (`metadata.bestOn`); over very light ones
   they look faint.
5. Some sheets have impact frames, stored in their frame JSON (`metadata.frameData`, loaded with the png;
   `metadata.hasAct: true` marks them). On those, `{ hitStop: true }` pauses the effect on each impact and
   `{ hitStop: (ms) => … }` also lets you freeze your game for that long; `PixelVfx.hits(this, EFFECTS.x)` lists them
   once loaded. On any other sheet `hitStop` does nothing (a development warning says so): do the hit stop in game code.
6. Full-screen effects (`metadata.screenSpace: true`: weather, transitions, nuke-style blasts) use a lot of mobile GPU
   memory (`metadata.gpuBytes`): at most one per scene, load it when needed (`play()` loads a sheet that was not
   preloaded), and it is freed when the scene ends.
7. Never tween a PixelVfx sprite's `scale`/`scaleX`/`scaleY` (Game.ts converts scale tweens to displayWidth, so scale 2 →
   tween 3 becomes 6×); for a size pop tween `displayWidth` to `metadata.frameWidth * k` and `displayHeight` to
   `metadata.frameHeight * k`.
8. Searched sheets load from the `url` in `effects.ts` and are the platform's own assets — they are the one exception
   to "declare every URL in src/assets.json".

Options: `scale`, `depth` (default 1000), `flip` (directional effects face right; flip when facing left),
`follow` (an object; `x, y` become offsets from it, and the effect goes when the object is destroyed), `repeat`
(override loop/one-shot; any finite repeat also removes the effect when it ends), `hitStop`, `keep`. Full-screen sheets
(rain) ignore x, y and cover the camera at any zoom. Sheets are freed when the scene that loaded them shuts down; pass
`{ keep: true }` to `preload`/`play` to keep them. In development a console warning appears when the loaded sheets pass
64 MB of GPU memory.
