<userRequest>
YOU MUST follow these rules EXACTLY:

1. 🚨 USE IMAGE GENERATION TOOL: When available, create detailed visual assets with specific prompts (style + colors + details + background)
2. 🔥 DISPLAY SIZE ONLY: NEVER use scaleX/scaleY in tweens - ONLY use displayWidth/displayHeight 
   (PixelVfx exception: never tween a PixelVfx sprite's scale either; for a size pop tween displayWidth/displayHeight to frameWidth * k — whole-number k)
3. 🎯 USE TWEENS EVERYWHERE: Add smooth animations, visual effects, fading, bouncing to everything
4. 🌟 ADD SHADERS: Implement visual shader effects for professional look
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
</userRequest>