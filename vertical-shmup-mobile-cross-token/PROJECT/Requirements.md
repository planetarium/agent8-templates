# Star Blaster - Requirements

## Core Gameplay
- [x] Vertical scrolling shmup (top-down, player at bottom)
- [x] Auto-shoot player bullets
- [x] Touch/pointer follow movement (mobile-first)
- [x] Arrow key support (desktop)
- [x] Enemy waves that escalate in difficulty
- [x] Boss wave every 5th wave with spread shot
- [x] Player HP with invincibility frames
- [x] Stardust Crystal drops from enemies
- [x] Score system with local best tracking
- [x] Particle explosion effects

## Scenes
- [x] Boot scene with progress bar loading
- [x] Title screen with animated ship + buttons
- [x] Game scene (full gameplay)
- [x] Game over screen with stats
- [x] Wallet/exchange info scene

## CROSS Integration
- [x] CrossRamp deployed (project: f8a20d22e093c3a3f4f19f290356d3b7)
- [x] SBT token: Star Blaster Token, symbol SBT
- [x] Asset key: stardust (100 stardust = 1 SBT)
- [x] CROSS Mini Hub button in WalletScene
- [x] Server: claimStardust mints stardust asset

## Known Patterns
- displayWidth/displayHeight used for all size tweens (never scaleX/scaleY)
- setDisplaySize() called on every image/sprite after creation
- Phaser gravity set to {x:0, y:0} for shmup physics
