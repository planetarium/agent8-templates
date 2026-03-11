# Project Structure

## CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key (see table below)

---

## Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.ts` `$asset.mint('data_fragment')` key

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: NEON DRIFT: Cyber Arena

| Element | Implementation |
|---------|---------------|
| Theme | Cyberpunk neon arena — cyber-runner navigates a dark dystopian arena hacking glowing data fragments |
| Collectible | Data Fragment (`data_fragment`) |
| Environment | seed `neondrift-cyberarena`, stone/dirt terrain with cyber wasteland feel |
| Loot Colors | Magenta (`#ff00ff`), Cyan (`#00ffff`), Violet (`#8800ff`) |
| Server Asset Key | `data_fragment` |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json          [CHANGE] GLB URLs
├── App.tsx              [DO NOT MODIFY]
├── stores/
│   ├── gameStore.ts     [MINIMAL]
│   ├── inventoryStore.ts [CHANGE]
│   ├── miningStore.ts   [CHANGE]
│   ├── localPlayerStore.ts [DO NOT MODIFY]
│   ├── qualityStore.ts  [DO NOT MODIFY]
│   └── playerActionStore.ts [DO NOT MODIFY]
└── components/
    ├── r3f/
    │   ├── GameSceneCanvas.tsx [DO NOT MODIFY]
    │   ├── Experience.tsx      [DO NOT MODIFY]
    │   ├── GameEnvironment.tsx [CHANGE] terrain/objects
    │   ├── Player.tsx          [DO NOT MODIFY]
    │   ├── LootManager.tsx     [CHANGE] collectible visual/logic
    │   └── CollectEffect.tsx   [CHANGE] particle colors
    ├── scene/
    │   ├── GameScene.tsx       [DO NOT MODIFY]
    │   ├── TitleScene.tsx      [CHANGE]
    │   └── PreloadScene.tsx    [DO NOT MODIFY]
    └── ui/
        ├── GameSceneUI.tsx     [DO NOT MODIFY]
        ├── InventoryHUD.tsx    [CHANGE]
        ├── MiningProgressUI.tsx [CHANGE]
        ├── InputController.tsx [DO NOT MODIFY]
        ├── QualitySettingsMenu.tsx [DO NOT MODIFY]
        └── LoadingScreen.tsx   [DO NOT MODIFY]
server/src/server.ts            [CHANGE]
```

---

## Absolute Constraints

- `server.ts` function names `collectFragment` / `getMyAssets` must not be renamed (client hardcoded)
- HTML inside `<Canvas>` is strictly forbidden
- `GameScene.tsx` must not use useState/useEffect

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server.ts` → `$asset.mint('새키', 1)`
2. `InventoryHUD.tsx` → `assets?.['새키']`
3. `.crossramp` → `asset_keys: ["새키"]`
