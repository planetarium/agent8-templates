<userRequest>
YOU MUST follow these rules EXACTLY:

1. 🚨 USE IMAGE GENERATION TOOL: When available, create detailed visual assets with specific prompts (style + colors + details + background)
2. 🔥 DISPLAY SIZE ONLY: NEVER use scaleX/scaleY in tweens - ONLY use displayWidth/displayHeight 
   (PixelVfx exception: never tween a PixelVfx sprite's scale either; for a size pop tween displayWidth/displayHeight to frameWidth * k — whole-number k)
3. 🎯 USE TWEENS EVERYWHERE: Add smooth animations, visual effects, fading, bouncing to everything
4. 🌟 ADD FILTERS: Add visual shader effects for a professional look with Phaser 4 filters
   (`enableFilters()` + `filters.internal` / `filters.external`, cameras need no enableFilters). See the PHASER 4 rule below
5. 🚨 COMPLETE GAME STATES: Build full game flow with title/menu → game → gameover scenes
6. 💎 MAKE IT PROFESSIONAL: Polish every feature to production quality
7. ✅ BACKTICKS FOR STRINGS: Always use backticks (`) for multi-line strings
8. 📐 SET DISPLAY SIZE: When adding images/sprites, ALWAYS use setDisplaySize() to control dimensions
   (VFX exception: PixelVfx sprites from src/game/vfx take only a whole-number `scale` option — NEVER setDisplaySize them. See docs/vfx-sheets.md)

🚨 CRITICAL RULE - NEVER BREAK THIS:
When tweening size changes, you MUST use displayWidth/displayHeight!!!

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
this.tweens.add({
    targets: sprite,
    scaleX: 1.5,        // ❌ FORBIDDEN!
    scaleY: 1.5,        // ❌ FORBIDDEN!
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});

✅ Correct Example (REQUIRED - ALWAYS WRITE):
this.tweens.add({
    targets: sprite,
    displayWidth: sprite.displayWidth * 1.5,    // ✅ MANDATORY!
    displayHeight: sprite.displayHeight * 1.5,  // ✅ MANDATORY!
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});

🚨 CRITICAL RULE - setDisplaySize():
When adding images/sprites, ALWAYS set display size immediately after creation!

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
const sprite = this.add.image(x, y, 'texture');
// ❌ No size control - sprite uses original image dimensions

✅ Correct Example (REQUIRED - ALWAYS WRITE):
const sprite = this.add.image(x, y, 'texture');
sprite.setDisplaySize(200, 150);  // ✅ MANDATORY! Always control dimensions

✅ VFX exception (PixelVfx sprites only):
PixelVfx.play(this, 'hit-spark', x, y, { scale: 2 });  // ✅ size with whole-number scale; ❌ never setDisplaySize a PixelVfx sprite

🚨 CRITICAL RULE - THIS PROJECT IS PHASER 4, NOT PHASER 3:
Phaser 3 FX, pipeline and mask APIs were removed. `vite build` does not type-check, so the build still passes and the
game crashes when the line runs (TypeError: Cannot read properties of undefined (reading 'addGlow')).

❌ Removed (FORBIDDEN - DO NOT WRITE)          ✅ Phaser 4 (REQUIRED)
sprite.preFX.addGlow(...)                      sprite.enableFilters().filters.internal.addGlow(...)
sprite.postFX.addBlur(...)                     sprite.enableFilters().filters.external.addBlur(...)
this.cameras.main.postFX.addVignette(...)      this.cameras.main.filters.external.addVignette(...)
preFX/postFX addBloom / addShine / addCircle   Phaser.Actions.AddEffectBloom / AddEffectShine / AddMaskShape
sprite.setPipeline / setPostPipeline           filters (shaders), sprite.setLighting(true) for Light2D
shape.createBitmapMask() + setMask()           sprite.enableFilters().filters.internal.addMask(shape)
sprite.setTintFill(0xffffff)                   sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)
                                               (setTintFill only logs an error and draws nothing: a hit flash silently vanishes)
group.children.each(fn) / .iterate(fn)         group.getChildren().forEach(fn)  or  for (const c of group.children) {…}
group.children.entries / entries[i]           group.getChildren() / group.getChildren()[i]
group.children.entries.length                  group.getLength()  or  group.children.size  (countActive(true) counts active ones)
                                               (children.entries is now the native Set method: .length is 0, [i] is undefined, no error)
group.children.contains(obj)                   group.contains(obj)  or  group.children.has(obj)
physics.world.bodies / staticBodies .iterate   for (const body of this.physics.world.bodies) {…}
new Phaser.Structs.Set()                       new Set()  (Group.children and world bodies are native Sets now)

The group rows apply to every group: `this.add.group()`, `this.physics.add.group()`, `this.physics.add.staticGroup()`.
`this.children` (the scene display list), `Phaser.Structs.List` and `Phaser.Structs.Map` still have `each`.

✅ Correct Example (REQUIRED - ALWAYS WRITE):
const orb = this.add.image(x, y, 'orb');
orb.setDisplaySize(64, 64);
orb.enableFilters();                                        // game objects need this once; cameras do not
const glow = orb.filters.internal.addGlow(0xffcc00, 4, 0, 1);
this.tweens.add({ targets: glow, outerStrength: 8, duration: 600, yoyo: true, repeat: -1 });

Other Phaser 4 changes that bite: `Geom.Point` → `Math.Vector2`; `Math.TAU` is now PI * 2 and `Math.PI2` is gone;
`ColorMatrix` methods moved to `.colorMatrix` (`cm.colorMatrix.sepia()`); `Mesh` / `Plane` were removed.
Before using an API you are not sure exists in Phaser 4, read the matching guide shipped inside the engine package:
`node_modules/phaser/skills/<topic>/SKILL.md` — start with `v3-to-v4-migration`, `filters-and-postfx` (all filters),
`v4-new-features`; also `tweens`, `sprites-and-images`, `physics-arcade`, `particles`, `cameras`, `scale-and-responsive`.
Run `npx tsc --noEmit -p tsconfig.app.json` after writing effect or group code: it catches removed APIs that the build
does not (except `children.entries.length` / `[i]`, which type-check and silently read nothing — use getChildren()).
</userRequest>