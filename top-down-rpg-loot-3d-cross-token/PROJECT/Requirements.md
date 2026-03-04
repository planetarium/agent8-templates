# Requirements

## Features
- **Map & Environment**: Procedural terrain setup suitable for quarter-view, populated with trees and rocks.
- **Resource Collection**: Scattered loot chests and crystals on the map that the player can walk over to collect.
- **Inventory System**: UI to display currently collected 'Crystal Shards'.
- **Blockchain Integration**: CrossRamp Mini Hub integration so players can convert their 'Crystal Shards' into 'RLM' tokens.

## Known Issues / Constraints
- React Three Fiber Canvas must not contain HTML DOM elements.
- Ensure Player does not fall through the Terrain by positioning them only after `TerrainData` is fully ready.
- Must ensure proper dependency loading without causing re-renders in `useFrame`.
