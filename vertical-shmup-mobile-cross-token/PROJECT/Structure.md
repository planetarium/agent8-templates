# Star Blaster - File Structure

## Source Layout
```
src/
  App.tsx              - GameServer.Provider wrapper + GameComponent
  App.css              - Global reset, touch-action: none
  assets.json          - All game asset URLs (characters, items, backgrounds)
  game/
    Game.ts            - Phaser config, scene list
    EventBus.ts        - Phaser ↔ React event bus (SCENE_CHANGE, HUD_UPDATE, etc.)
    scenes/
      BootScene.ts     - Asset preloader → emits BOOT_PROGRESS to React
      TitleScene.ts    - Scrolling BG + ship animation only (no Phaser UI)
      GameScene.ts     - Core gameplay → emits HUD_UPDATE, GAME_OVER events
      GameOverScene.ts - Dark BG only → emits SCENE_CHANGE + GAME_OVER
      WalletScene.ts   - BG only → emits SCENE_CHANGE
  components/
    GameComponent.tsx  - Phaser mount + EventBus listener + overlay orchestration
    overlays/
      LoadingOverlay.tsx        - Boot loading bar + logo (CSS Module)
      LoadingOverlay.module.css
      TitleOverlay.tsx          - Title screen (glow text, buttons, best score)
      TitleOverlay.module.css
      HUDOverlay.tsx            - In-game HUD (score, wave, stardust, HP hearts)
      HUDOverlay.module.css
      GameOverOverlay.tsx       - Game over panel (stats, buttons)
      GameOverOverlay.module.css
      WalletOverlay.tsx         - Stardust exchange info + CROSS Mini Hub button
      WalletOverlay.module.css
      CrossRampOverlay.tsx      - Loading spinner while opening CROSS Mini Hub
      CrossRampOverlay.module.css
server/
  src/server.ts        - claimStardust, getStardustBalance, saveHighScore, getLeaderboard
.crossramp             - CrossRamp deployment metadata
```

## Scene Flow
BootScene → TitleScene ↔ GameScene → GameOverScene ↔ WalletScene

## Key Architecture Notes
- **EventBus**: Phaser scenes emit events → GameComponent subscribes → updates React state
- **UI split**: Phaser = game logic + background visuals only; React = ALL UI elements
- **CSS Modules**: Each overlay has its own `.module.css`, no global class collisions
- **Scene routing**: GameComponent watches `currentScene` state and renders the correct overlay
- **WalletScene**: no longer emits via `scene.events` — all routing through `EventBus`
- **CROSS Mini Hub**: button click in WalletOverlay → `onOpenCrossRamp` prop → `server.getCrossRampShopUrl()`
- Player bullets: Phaser.GameObjects.Rectangle (no texture needed)
- Enemy bullets: Phaser.GameObjects.Ellipse
