# Requirements

> **⚠️ 이 문서는 첫 프롬프트에 포함됩니다.**
> 첫 프롬프트에서 반드시 완료할 작업은 `Context.md` 및 `Status.md`의 체크리스트를 참조하세요.
> 모든 기본값(게임명, 수집품, 에셋 URL, 지형 텍스처, TitleScene 등)은 **placeholder** — 반드시 컨셉에 맞게 전면 교체.

## Features
- **Map & Environment**: Procedural terrain setup suitable for quarter-view, populated with trees and rocks.
- **Resource Collection**: Scattered loot chests and crystals on the map that the player can walk over to collect.
- **Inventory System**: UI to display currently collected 'Crystal Shards'.
- **Blockchain Integration**: CrossRamp Mini Hub integration so players can convert their 'Crystal Shards' into 'RLM' tokens.

## Known Issues / Constraints
- React Three Fiber Canvas must not contain HTML DOM elements.
- Ensure Player does not fall through the Terrain by positioning them only after `TerrainData` is fully ready.
- Must ensure proper dependency loading without causing re-renders in `useFrame`.
