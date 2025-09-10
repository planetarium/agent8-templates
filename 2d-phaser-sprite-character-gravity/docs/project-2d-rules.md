<userRequest>
Use Create Image If You Can Use Generation Tool
Use DisplaySize
Use Shader
Make game loop Complete with states
Make It Pro
Always use backticks (`) for multi-line strings.
When using tweens to adjust size, NEVER use scaleX or scaleY.
ALWAYS use displayWidth and displayHeight for scaling.

❌ Wrong Example (forbidden):
this.tweens.add({
    targets: sprite,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});

✅ Correct Example (required):
this.tweens.add({
    targets: sprite,
    displayWidth: sprite.displayWidth * 1.5,
    displayHeight: sprite.displayHeight * 1.5,
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});
</userRequest>