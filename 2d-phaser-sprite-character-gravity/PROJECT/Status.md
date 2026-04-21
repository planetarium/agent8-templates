# Status — 2d-phaser-sprite-character-gravity

## Implemented

- React shell mounts Phaser via `GameComponent` with StrictMode-safe single-init and teardown on unmount
- `Phaser.Game` config with Arcade Physics (`gravity.y = 2000`), `Scale.RESIZE`, full-window canvas
- Critical scale/tween compatibility patch in `Game.ts` (`setDisplaySize`, `setScale`, `TweenManager.add`)
- `MainScene` with sky-blue background, static ground rectangle, world bounds, physics debug graphic
- `SpriteCharacter` (extends `Phaser.Physics.Arcade.Sprite`) with idle / left / right / jump / attack animations driven from the `2dbasic` sheet
- Arrow-key movement, ground-checked jump, Space-key attack with transient hitbox and 300ms auto-destroy + 500ms safety timeout
- Player ↔ ground collider, world-bounds collision, and `setBounce(0.2)`
- Sprite sheet loaded from `src/assets.json` with `frameWidth`/`frameHeight` metadata

## Installed but not wired

- `@agent8/gameserver` — no networking / session code
- `lucide-react` — no icons rendered anywhere
- Tailwind CSS — directives included but no utility classes used in components
- `attackSound` field on `SpriteCharacter` — declared but never loaded or assigned
- Attack hitbox overlap/damage handler — hitbox is spawned but no `physics.add.overlap` target is registered
