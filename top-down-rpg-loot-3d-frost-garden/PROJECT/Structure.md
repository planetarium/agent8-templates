# Project Structure

## 🚨 CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key (see table below)

---

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server.ts` `$asset.mint('starflower')` key

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: FROST GARDEN

| Element | Implementation |
|---------|---------------|
| Theme | Frozen botanical RPG — lone explorer wanders an ethereal frost-covered garden, harvesting rare starflowers from icy crystalline formations |
| Collectible | Starflower (`starflower`) |
| Environment | seed: `frost-garden-v1`, snowy terrain with frozen trees and crystalline formations |
| Loot Colors | Sapphire blue (`#44aaff`), cyan (`#22ccee`), light blue (`#88ddff`) |
| Server Asset Key | `starflower` |
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

- `server.ts` 함수명 `collectStarflower` / `getMyAssets` 변경 금지 (클라이언트 하드코딩)
- HTML inside `<Canvas>` 절대 금지
- `GameScene.tsx`에 useState/useEffect 금지

---

## CrossRamp: Currency Rename (if user requests)

3-way sync:
1. `server.ts` → `$asset.mint('새키', 1)`
2. `InventoryHUD.tsx` → `assets?.['새키']`
3. `.crossramp` → `asset_keys: ["새키"]`
