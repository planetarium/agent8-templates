<userRequest>
YOU MUST follow these rules EXACTLY:

1. 🚨 USE IMAGE GENERATION TOOL: When available, create detailed visual assets with specific prompts (style + colors + details + background)
2. 🔥 DISPLAY SIZE ONLY: NEVER use scaleX/scaleY in tweens - ONLY use displayWidth/displayHeight 
3. 🎯 USE TWEENS EVERYWHERE: Add smooth animations, visual effects, scaling, fading, bouncing to everything
4. 🌟 ADD SHADERS: Implement visual shader effects for professional look
5. 🚨 COMPLETE GAME STATES: Build full game flow with menu → game → gameover scenes
6. 💎 MAKE IT PROFESSIONAL: Polish every feature to production quality
7. ✅ BACKTICKS FOR STRINGS: Always use backticks (`) for multi-line strings

🚨 CRITICAL RULE - NEVER BREAK THIS:
When tweening size changes, you MUST use displayWidth/displayHeight, NOT scaleX/scaleY!

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
</userRequest>