# Requirements & Patterns

## Critical: Asset + UI Pair Rule (First Prompt)

> **Assets and overlay UI redesign are mandatory together.** After generating any image assets (NanoBanana Pro), you MUST fully redesign `src/components/overlays/*` — layout, colors, modals, HUD style — to match the chosen concept. **Do this on the first prompt** — do not defer UI to a later prompt or follow-up. **Replacing assets only while leaving the UI unchanged is not allowed.**

## Immutable EventBus Keys

These event names are hardcoded in both React and Phaser. **Never rename them.**

| Key | Direction | Purpose |
|-----|-----------|---------|
| `SCENE_CHANGE` | Phaser → React | payload: { scene: string } — scene routing |
| `BOOT_PROGRESS` | Phaser → React | payload: { value: number } — loading bar |
| `HUD_UPDATE` | Phaser → React | payload: HUDData — score, wave, stardust, hp |
| `GAME_OVER` | Phaser → React | payload: GameOverData — game over stats |
| `OPEN_CROSS_RAMP` | Phaser → React | Trigger CROSS Mini Hub open |
| `STARDUST_BALANCE` | React → React | payload: { balance: number } — after claimStardust |

## Asset Generation Rules (Mandatory)

**Tool: NanoBanana Pro — no other image tool is permitted.**

All generated assets must look like they were crafted by a professional game artist. Low-effort or generic results are not acceptable. Apply the following standards to every image prompt:

- **Style**: Specify an explicit art direction (e.g. "hand-painted 2D", "cel-shaded cartoon", "dark fantasy illustration"). For pixel art, see **Pixel Art quality rules** below.
- **Pixel Art style (quality)** — When using pixel art, the tool often produces low-resolution, blurry output. To avoid this:
  - **Never use** `"pixel art"` or `"16-bit pixel art"` alone — always add quality modifiers.
  - **Required modifiers** in `style`: include at least one of `high-quality`, `high-resolution`, `detailed`, `HD`.
  - **Required in `details`**: add `clean edges`, `vibrant colors`, `professional sprite quality`, or `sharp pixel edges, well-defined silhouette`.
  - **Avoid**: `low-res`, `retro low quality`, `simple`, `minimal` — these degrade output.
  - **Good examples**:
    - `style: "high-quality pixel art, clean edges, vibrant palette, professional game sprite, HD rendering"`
    - `style: "detailed pixel art style with crisp edges, rendered in high resolution, rich color palette"`
  - **Bad examples**: `style: "pixel art"`, `style: "16-bit pixel art"` (no quality modifiers)
- **Quality bar**: The result must be visually polished — rich colors, clear silhouette, readable at small size, consistent with the game's art direction
- **Required prompt fields** — every generation call must include all four:
  - `style` — art style and rendering technique
  - `colors` — exact color palette (hex codes or named colors matching the game's theme)
  - `details` — subject description, pose, expression, costume, key visual features
  - `background` — transparent OR a specific background treatment
- **Consistency**: All assets in a single game must share the same art style. Never mix styles between player, enemies, boss, and background.
- **Readable at game size**: Characters are rendered small on screen. Design for clarity at 48×48 to 96×96 px — bold outlines, strong contrast, no fine detail that disappears when scaled down.
- **Required image assets**: `background`, `player`, `enemy`, `boss`, `stardust` (or concept-equivalent collectible), `playerBullet`, `enemyBullet`. Optional: `token` icon for WalletOverlay.
- **UI redesign mandatory (first prompt)**: After generating assets, you MUST fully redesign overlay components to match the chosen concept (layout, colors, modals). **Do this on the same prompt — do not defer to a follow-up.** Replacing assets only while leaving the UI unchanged is not allowed.

## Technical Rules (Violations Break the Game)

- **`setDisplaySize()` is mandatory** — call it immediately after every `add.image()` or `add.sprite()`. Never leave size unspecified.
- **No `scaleX` / `scaleY` in Tweens** — use `displayWidth` / `displayHeight` instead. The engine intercepts scale and remaps to display dimensions.
- **Multiline strings**: use backticks, not concatenation.

## Core Gameplay (Template Default)

- [x] Vertical scrolling shmup (top-down, player at bottom)
- [x] Auto-shoot player bullets
- [x] Touch/pointer follow movement (mobile-first)
- [x] Arrow key support (desktop)
- [x] Enemy waves that escalate in difficulty
- [x] Boss wave every 5th wave with spread shot
- [x] Player HP with invincibility frames
- [x] Stardust Crystal drops from enemies (configurable per concept)
- [x] Score system with local best tracking
- [x] Particle explosion effects

## Scenes

- [x] Boot scene with progress bar loading
- [x] Title screen with animated ship + buttons
- [x] Game scene (full gameplay)
- [x] Game over screen with stats
- [x] Wallet/exchange info scene

## CROSS Integration Pipeline (First Prompt — Do Not Omit)

When changing the game concept, **all 4 touchpoints below must be synchronized** for token integration to work. Updating only some will break claim/exchange functionality.

```
GameScene.ts          → stardustPending aggregation → GAME_OVER emit
GameComponent.tsx     → claimStardust(amount) → server.remoteFunction('claimStardust', [amount])
server/src/server.ts  → $asset.mint('stardust', amount)   ← asset key
WalletOverlay.tsx     → "100 STARDUST = 1 SBT"            ← token name / exchange rate display
```

### Changeable vs Immutable

| Target | Changeable? | Notes |
|--------|-------------|-------|
| `server.ts` — `$asset.mint('stardust')` asset key | Yes | Must change **in sync** with GameScene drop type `'stardust'` string |
| `server.ts` — `$asset.get('stardust')` | Yes | Use same key as mint |
| `server.ts` — function names `claimStardust`, `getStardustBalance` | **No** | GameComponent calls `remoteFunction('claimStardust')` — hardcoded |
| `GameComponent.tsx` entire file | **No** | claimStardust, openCrossRamp logic must never be modified |
| `EventBus.OPEN_CROSS_RAMP` | **No** | Changing event key breaks integration |
| `WalletOverlay.tsx` — token name, exchange rate text | Yes | **Must** update to match concept |

### When Changing Exchange Rate

To change the exchange rate (e.g. 100 stardust = 1 SBT):
1. `server.ts` — update claimStardust internal logic (validation range, etc.)
2. `WalletOverlay.tsx` — update display text ("100 STARDUST", "1 SBT TOKEN")  
Both must be updated together so UI matches actual behavior.

### Template Default

- [x] CrossRamp deployed (project: f8a20d22e093c3a3f4f19f290356d3b7)
- [x] Token: SBT (100 stardust = 1 SBT)
- [x] Asset key: `stardust`
- [x] CROSS Mini Hub button in WalletScene
- [x] Server: claimStardust mints stardust asset

## Known Patterns

- displayWidth/displayHeight used for all size tweens (never scaleX/scaleY)
- setDisplaySize() called on every image/sprite after creation
- Phaser gravity set to {x:0, y:0} for shmup physics
