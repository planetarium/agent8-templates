# Project Structure

## Project Summary

This project is a boilerplate for vertical scrolling shmup (top-down) mobile games with CROSS blockchain token integration. Built with Phaser 3 and React overlays, it includes auto-shoot gameplay, enemy waves with boss fights, stardust collectibles, and a Wallet scene for token exchange. An AI agent can receive a game concept and fully recreate the visual theme, overlays, and token branding — all without touching the core engine.

Files are marked as **[CHANGE]** (must be replaced per concept) or **[DO NOT MODIFY]** (engine/infrastructure).

> **Critical**: `assets.json` and overlay components are a **pair**. When you replace assets, you must also fully redesign overlays (TitleOverlay, HUDOverlay, GameOverOverlay, WalletOverlay) to match the chosen concept. **Do both on the first prompt** — do not defer UI to a later prompt. Never update assets without updating overlays.

## Source Layout

```
src/
├── assets.json                          [CHANGE] All sprite/image URLs — replace every asset
├── App.tsx                              [DO NOT MODIFY] GameServer.Provider wrapper + GameComponent
├── App.css                              [CHANGE if theme] Global reset, touch-action: none
│
├── game/
│   ├── Game.ts                          [DO NOT MODIFY] Phaser config, engine overrides
│   ├── EventBus.ts                      [DO NOT MODIFY] Phaser ↔ React event bus
│   └── scenes/
│       ├── BootScene.ts                 [DO NOT MODIFY] Asset preloader → emits BOOT_PROGRESS
│       ├── TitleScene.ts                [CHANGE if BG] Scrolling BG + ship animation
│       ├── GameScene.ts                 [CHANGE] Core gameplay, enemy waves, boss, power-ups
│       ├── GameOverScene.ts             [DO NOT MODIFY] Dark BG only → emits SCENE_CHANGE
│       └── WalletScene.ts               [DO NOT MODIFY] BG only → emits SCENE_CHANGE
│
├── components/
│   ├── GameComponent.tsx                [DO NOT MODIFY] Phaser mount + EventBus listener
│   └── overlays/
│       ├── LoadingOverlay.tsx            [CHANGE if logo] Boot loading bar + logo
│       ├── LoadingOverlay.module.css     [CHANGE]
│       ├── TitleOverlay.tsx              [CHANGE] Title screen — MANDATORY with assets
│       ├── TitleOverlay.module.css       [CHANGE]
│       ├── HUDOverlay.tsx                [CHANGE] In-game HUD — MANDATORY with assets
│       ├── HUDOverlay.module.css         [CHANGE]
│       ├── GameOverOverlay.tsx           [CHANGE] Game over panel — MANDATORY with assets
│       ├── GameOverOverlay.module.css    [CHANGE]
│       ├── WalletOverlay.tsx             [CHANGE] Exchange info + CROSS Mini Hub button
│       ├── WalletOverlay.module.css      [CHANGE]
│       ├── CrossRampOverlay.tsx           [CHANGE if theme]
│       └── CrossRampOverlay.module.css    [CHANGE]
│
server/
└── src/server.ts                        [CHANGE if token] claimStardust, token name/ratio

.crossramp                               [CHANGE if asset key] CrossRamp deployment metadata
```

## Scene Flow

BootScene → TitleScene ↔ GameScene → GameOverScene ↔ WalletScene

## Key Architecture Notes

- **EventBus**: Phaser scenes emit events → GameComponent subscribes → updates React state
- **UI split**: Phaser = game logic + background visuals only; React = ALL UI elements
- **CSS Modules**: Each overlay has its own `.module.css`, no global class collisions
- **Scene routing**: GameComponent watches `currentScene` state and renders the correct overlay
- **WalletScene**: all routing through `EventBus`
- **CROSS Mini Hub**: button click in WalletOverlay → `onOpenCrossRamp` prop → `server.getCrossRampShopUrl()`
- Player bullets: texture or Rectangle; Enemy bullets: texture or Ellipse — both require setDisplaySize()
