# Emberwood — Structure

```
index.html               canvas + loading bar
src/main.tsx             React entry — mounts <App /> into #root
src/App.tsx              preload GLB/anim assets → createGame3D (village)
src/village.scene.json   sunset village: Elder (Interactable), gate Area3D,
                         player rig (controller `animations` map, sword Trail3D),
                         HUD (UiText/UiBanner/UiDialogue/UiButton)
src/grove.scene.json     dusk grove: 3 wolves (PathFollow), return portal,
                         empty `Maze` holder (hedges are built at runtime)
src/behaviors.ts         GROVE_GRID + VillageDirector / GroveDirector / SwordStrike
generate-dressing.ts     VILLAGE dressing generator: rebuilds environment + the
                         visual `Village` subtree (timber cottages, fences,
                         lanterns, stall, grass/flowers, treelines) — edit
                         numbers, `bun generate-dressing.ts`, reload. Gameplay
                         nodes (Elder/Player/HUD/GroveGate) are preserved.
src/quest.ts             cross-scene quest flags (module singleton)
verify.ts                audit + headless quest E2E + replay determinism
```

## Scene relationship

`App.tsx` boots the **village**. `goToScene(grove)` happens in
VillageDirector.onGateEnter; `goToScene(village)` in GroveDirector.onPortalEnter
and the play-again button. Both scenes redeclare the same input map and player
rig — scenes are self-contained by design (a scene JSON is the whole truth).

## The one-grid trick

`GROVE_GRID` (rows of `#`/`.`) is the single source for:
1. hedge collider boxes — `parseCells` + `mergeSolidRects` (from `incanto/2d`,
   the pure helpers are dimension-agnostic) → few merged StaticBody3D boxes;
2. wolf routes — `gridFromRows` + `findPath` (A*, no diagonals) → PathFollow
   waypoint rings;
3. spawn/patrol cells in `PATROLS`.
