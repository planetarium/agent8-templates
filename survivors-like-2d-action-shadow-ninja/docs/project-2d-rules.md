<userRequest>
## 🚨 PRE-BUILT TEMPLATE — FIRST PROMPT SCOPE (READ THIS FIRST)

This is a COMPLETE, FULLY PLAYABLE game. The first prompt ONLY requires CrossRamp integration.

### ✅ FIRST PROMPT: DO exactly these steps (nothing more)

1. Write `.crossramp` file with token config
2. Call `read_gameserver_sdk_v2`
3. Call `read_gameserver_sdk_crossramp` → deploys CrossRamp
4. Read `server.js` → confirm `credits` asset key
5. If user specifies a new token/drop name: rename `credits` key in `server.js`, game scene files, and `.crossramp` (3-way sync)
6. Generate EXACTLY 2 images: **drop item icon** + **token logo** — update `assets.json` drop URL
7. Run `bun run build` to verify

### 🚫 FIRST PROMPT: DO NOT do any of the following

- Generate player ship / enemy / boss / bullet / background images — game is already built
- Modify overlay components
- Rewrite or retheme game scene files
- Run `npx @agent8/gameserver-node init` — server is already initialized
- Redesign UI layout, colors, or CSS

---

## Rules for subsequent prompts

YOU MUST follow these rules EXACTLY:

1. 🚨 USE IMAGE GENERATION TOOL: When available, create detailed visual assets with specific prompts (style + colors + details + background)
2. 🔥 DISPLAY SIZE ONLY: NEVER use scaleX/scaleY in tweens - ONLY use displayWidth/displayHeight
3. 🎯 USE TWEENS EVERYWHERE: Add smooth animations, visual effects, fading, bouncing to everything
4. 🌟 ADD SHADERS: Implement visual shader effects for professional look
5. 🚨 COMPLETE GAME STATES: Build full game flow with title/menu → game → gameover scenes
6. 💎 MAKE IT PROFESSIONAL: Polish every feature to production quality
7. ✅ BACKTICKS FOR STRINGS: Always use backticks (`) for multi-line strings
8. 📐 SET DISPLAY SIZE: When adding images/sprites, ALWAYS use setDisplaySize() to control dimensions

🚨 CRITICAL RULE - NEVER BREAK THIS:
When tweening size changes, you MUST use displayWidth/displayHeight!!!

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
this.tweens.add({
    targets: sprite,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});

✅ Correct Example (REQUIRED - ALWAYS WRITE):
this.tweens.add({
    targets: sprite,
    displayWidth: sprite.displayWidth * 1.5,
    displayHeight: sprite.displayHeight * 1.5,
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});

🚨 CRITICAL RULE - setDisplaySize():
When adding images/sprites, ALWAYS set display size immediately after creation!

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
const sprite = this.add.image(x, y, 'texture');

✅ Correct Example (REQUIRED - ALWAYS WRITE):
const sprite = this.add.image(x, y, 'texture');
sprite.setDisplaySize(200, 150);
</userRequest>
