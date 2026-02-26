# Star Blaster - Project Context

## Overview
Classic arcade-style vertical shoot 'em up (shmup) for mobile browsers. Players pilot a spaceship, fight waves of enemies and bosses, collect Stardust Crystal drops, and exchange them for SBT (Star Blaster Token) on-chain via CROSS Mini Hub.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Game Engine**: Phaser 3.87
- **Server**: @agent8/gameserver-node (structured TypeScript in server/)
- **Blockchain**: CROSS Mini Hub via CrossRamp (project ID: f8a20d22e093c3a3f4f19f290356d3b7)
- **Token**: SBT (Star Blaster Token), mint/burn ratio: 100 stardust = 1 SBT

## Critical Memory
- `.crossramp` file at root: uuid, project_id, asset_keys: ["stardust"]
- Asset key for in-game currency: `stardust`
- CrossRamp exchange: 100 stardust → 1 SBT token
- Game is mobile-first (touch controls, pointer follow)
- Gravity set to 0,0 for shmup (overrides template default of y:2000)
- `getCrossRampShopUrl` called from React layer (GameComponent), triggered by Phaser WalletScene event
