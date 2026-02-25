# Requirements & Patterns

## Critical: Asset + UI Pair Rule (First Prompt)

> **Assets and UI redesign are mandatory together.** After generating any image assets (NanoBanana Pro), you MUST fully redesign `src/App.tsx` — layout, colors, modals, joystick style — to match the chosen concept. **Do this on the first prompt** — do not defer UI to a later prompt or follow-up. **Replacing assets only while leaving the UI unchanged is not allowed.**

## Immutable gameEvents Keys

These event names are hardcoded in both React and Phaser. **Never rename them.**

| Key | Direction | Purpose |
|-----|-----------|---------|
| `addGold` | Phaser → React | Increment gold counter |
| `updateHealth` | Phaser → React | Refresh heart/health display |
| `updateXp` | Phaser → React | Update XP bar and level |
| `showLevelUp` | Phaser → React | Open ability selection modal |
| `selectAbility` | React → Phaser | Send chosen ability to MainScene |
| `joystickMove` | React → Phaser | Joystick delta (x, y) |
| `joystickStop` | React → Phaser | Joystick released |
| `pauseGame` | React → Phaser | Pause physics |
| `resumeGame` | React → Phaser | Resume physics |
| `startGameFromUI` | React → Phaser | Transition TitleScene → MainScene |
| `restartGameFromUI` | React → Phaser | Transition GameOverScene → TitleScene |
| `forceGameOver` | React → Phaser | Trigger game over from UI |
| `showTitle` | Phaser → React | Show title screen state |
| `gameStart` | Phaser → React | Game started |
| `showGameOver` | Phaser → React | Show game over screen state |
| `gameOver` | Phaser → React | Game ended (with stats payload) |

## Asset Generation Rules (Mandatory)

**Tool: NanoBanana Pro — no other image tool is permitted.**

All generated assets must look like they were crafted by a professional game artist. Low-effort or generic results are not acceptable. Apply the following standards to every image prompt:

- **Style**: Specify an explicit art direction (e.g. "pixel art 16-bit", "hand-painted 2D", "cel-shaded cartoon", "dark fantasy illustration")
- **Quality bar**: The result must be visually polished — rich colors, clear silhouette, readable at small size, consistent with the game's art direction
- **Required prompt fields** — every generation call must include all four:
  - `style` — art style and rendering technique
  - `colors` — exact color palette (hex codes or named colors matching the game's theme)
  - `details` — subject description, pose, expression, costume, key visual features
  - `background` — transparent OR a specific background treatment
- **Consistency**: All assets in a single game must share the same art style. Never mix styles between player, enemies, and background.
- **Readable at game size**: Characters are rendered small on screen. Design for clarity at 48×48 to 96×96 px — bold outlines, strong contrast, no fine detail that disappears when scaled down.
- **UI redesign mandatory (first prompt)**: After generating assets, you MUST fully redesign `src/App.tsx` to match the chosen concept (layout, colors, modals, joystick style). **Do this on the same prompt — do not defer to a follow-up.** Replacing assets only while leaving the UI unchanged is not allowed. This is a hard requirement.

## Technical Rules (Violations Break the Game)

- **`setDisplaySize()` is mandatory** — call it immediately after every `add.image()` or `add.sprite()`. Never leave size unspecified.
- **No `scaleX` / `scaleY` in Tweens** — use `displayWidth` / `displayHeight` instead. The engine intercepts scale and remaps to display dimensions.
- **No hardcoded balance values in scene files** — all numbers (speed, HP, damage, fire rate) live in `src/config/`.
- **Multiline strings**: use backticks, not concatenation.

## Adding a New Ability Effect Type (4-Step Checklist)

When an ability requires behavior not covered by `stat` / `multishot` / `pierce` / `aoe`:

```
Step 1 — abilities.ts
  Add new type to AbilityEffect union:
  | { type: 'yourType'; param1: number; param2?: number }

Step 2 — abilities.ts
  Add the ability entry to ABILITIES array with the new effect type.

Step 3 — MainScene.ts
  Add a state field to track the effect:
  private yourTypeActive = false; // or a counter, timer, etc.

Step 4 — MainScene.ts
  Add a branch in handleSelectAbility():
  case 'yourType': implement the full game logic here
  (also hook into update() if the effect runs continuously)
```

## Code Patterns

- **Entity factories**: `createPlayer`, `createEnemy`, `createProjectile` are pure factory functions. Runtime state is stored with `sprite.setData('key', value)` / `sprite.getData('key')`.
- **Phaser Groups**: Enemies, projectiles, coins, and XP gems are managed as `Physics.Arcade.Group`. Collisions use `this.physics.add.overlap(groupA, groupB, callback)`.
- **Config separation**: All tunable values belong in `src/config/`. Scene files only import and consume them.
- **Wave system**: `WaveSystem` runs on a 60-second cycle per wave with weighted random enemy selection. Difficulty multipliers are applied per wave index.
- **Visual feedback built-in**: `emitParticles(x, y)`, `showFloatingText(x, y, text)`, and `this.cameras.main.shake()` are available in MainScene — use them freely.
- **Phaser ↔ React interop**: Always use `gameEvents.dispatchEvent(new CustomEvent('key', { detail: payload }))` in Phaser, and `gameEvents.addEventListener('key', handler)` in React.
