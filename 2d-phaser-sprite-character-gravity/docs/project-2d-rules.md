<userRequest>
🚨 CRITICAL: Use Create Image If You Can Use Generation Tool - Make prompts detailed with style, colors, details, background 🚨
🔥 CRITICAL: Use DisplaySize - NEVER scaleX/scaleY for tweens 🔥
🎯 CRITICAL: ALWAYS use Tweens for animations - Add visual effects, smooth movements, scaling, fading, bouncing effects! 🎯
Use Shader
🚨 CRITICAL: Make game loop Complete with states 🚨
Make It Pro
Always use backticks (`) for multi-line strings.
🚨 When using tweens to adjust size, NEVER EVER use scaleX or scaleY - THIS BREAKS EVERYTHING! 🚨
🔥 ALWAYS ALWAYS use displayWidth and displayHeight for scaling - THIS IS MANDATORY! 🔥

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