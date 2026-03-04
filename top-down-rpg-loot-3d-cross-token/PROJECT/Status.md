# Project Status

## Default Concept (Placeholder)

| Field | Default Value |
|-------|---------------|
| Game Name | Crystal Dungeon 3D |
| Genre | 3D Quarter-View Dungeon Crawler |
| Player | Human knight (base-model.glb) |
| Enemy Types | Skeleton, Zombie, Golem, Boss |
| Collectible | Gem (common/rare/epic) |
| Token Name | GDT (Gem Dungeon Token) |
| Exchange Rate | 100 GEMS = 1 GDT |
| Asset Key | `gem` |

> All above values are **placeholder defaults only**. Replace them entirely when building a new game from this template.

## 11-Step Concept Recreation Checklist

### Phase 1 — Concept & Assets
- [ ] **Step 1**: Identify game concept (world, enemy theme, collectible type)
- [ ] **Step 2**: Generate player character model (or select GLB from asset library)
- [ ] **Step 3**: Design enemy visuals (replace capsule geometry in `Enemy.tsx`)
- [ ] **Step 4**: Design collectible gem visuals (replace octahedron in `LootGem.tsx`)

### Phase 2 — Environment
- [ ] **Step 5**: Redesign dungeon environment — `DungeonRoom.tsx` walls/lighting, `Floor.tsx` material
- [ ] **Step 6**: Update `assets.json` with new character/animation URLs

### Phase 3 — UI Screens
- [ ] **Step 7**: Redesign **all 5 UI screens** — TitleScreen, HUDOverlay, GameOverScreen, WalletScreen, CrossRampOverlay
  - Update game title, tagline, colors, font style, icons
  - Update token name (GDT → your token name)
  - Update exchange rate text

### Phase 4 — Game Mechanics
- [ ] **Step 8**: Tune `gameStore.ts` enemy configs (HP, speed, color per type)
- [ ] **Step 9**: Tune gem drop rates and values in `gameStore.ts` `spawnGemAtPosition()`

### Phase 5 — CROSS Integration
- [ ] **Step 10**: Run `read_gameserver_sdk_crossramp` tool to create `.crossramp` file
  - Set `asset_keys` to match the collectible key used in `server.ts` (`gem`)
- [ ] **Step 11**: Verify all 4 CROSS touchpoints are synchronized (see `PROJECT/Requirements.md`)

> **Steps 7, 10, 11 are mandatory for CROSS token exchange to function.**
