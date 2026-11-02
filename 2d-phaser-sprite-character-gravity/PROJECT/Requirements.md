# Requirements — 2d-phaser-sprite-character-gravity

## Coding Patterns

- All gameplay code lives under `src/game/`; React under `src/components/` is a thin host and must not reach into Phaser objects directly.
- Extend behavior by subclassing `Phaser.Physics.Arcade.Sprite` (same pattern as `SpriteCharacter`) or by adding new scenes under `src/game/scenes/`, not by inlining logic into `GameComponent.tsx`.
- Load sprite/audio URLs and frame metadata through `src/assets.json` and read them in `preload()`; do not hardcode asset URLs inside scenes or characters.
- Animation keys are namespaced by texture key (`` `${spriteKey}-left` ``, etc.) and guarded by `anims.exists(...)` — reuse that convention so multiple instances of the same sheet don't re-register animations.
- Ground checks go through `body.touching.down || body.blocked.down` (`SpriteCharacter.isGrounded()`). New platforms must register with `this.physics.add.collider(player, platform)`.
- Pass the scene's `delta` into `SpriteCharacter.update(cursors, delta)` and keep all gameplay timing in seconds derived from it — no frame counters. Tune feel through the constants at the top of `SpriteCharacter.ts` (`MOVE_SPEED`, `JUMP_POWER`, `*_ACCEL`/`*_DECEL`, `COYOTE_TIME`, `JUMP_BUFFER_TIME`).
- Trigger one-shot actions such as jump on a fresh press (`Phaser.Input.Keyboard.JustDown`), not on `isDown`, and spend the coyote/buffer windows when the jump fires so one press can't jump twice.
- The critical section in `Game.ts` (Sprite/Image scale + Tween overrides) is off-limits; build scaling logic on top of `setDisplaySize` + `setScale`, not by editing the patch.

## Known Issues / Constraints

- Arcade Physics only — no tilemap, no Matter, no Rapier. `gravity.y` is hardcoded to `2000` in `Game.ts`.
- `physics.world.createDebugGraphic()` is called in `preload()`, so the physics debug overlay is always on. Remove it for production.
- World bounds are set once in `create()` from the initial canvas size; `Phaser.Scale.RESIZE` will grow the canvas but physics bounds stay fixed.
- `SpriteCharacter` is tied to the `2dbasic` sheet layout: frames `0` (idle), `3` (jump), `4–7` (left), `8–11` (right), `12–15` (attack). A different sheet needs matching ranges.
- Attack hitbox is a plain `Phaser.GameObjects.Rectangle` with Arcade physics added; no overlap handler is wired — damage logic is the caller's responsibility.
- `attackSound` is declared but never loaded or assigned; the `try/catch` around `.play()` is dead code until audio is added to `assets.json`.
