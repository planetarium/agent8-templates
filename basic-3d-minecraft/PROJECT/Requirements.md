# Requirements — basic-3d-minecraft (Incanto)

## Coding Patterns

- World edits go through `VoxelGrid3D` APIs — never touch its InstancedMesh.
  `blocksChanged` fires on every edit; the Terrain behavior listens and
  refreshes nearby chunk colliders.
- New tiles: extend the selection (`TILES` in App.tsx) — colors come from
  `VOXEL_PALETTE[tile]`; custom palettes can extend the exported table.
- New interactions: follow Builder's recipe — controller yaw/pitch → ray
  direction, `physics.castRay(eye, dir, range, body)` → point/normal math.
- Heavy terrain work belongs in behaviors with explicit throttles (the
  chunk rebuild runs every 3rd frame, original parity).

## Known Issues / Constraints

- removeCube does nothing (ORIGINAL PARITY — it's mapped but unconsumed
  there too).
- Tile bar is 5 color chips, not the original's per-tile mini-3D canvases;
  theme panel (T) not ported. Placement/preview behavior is identical.
- Block placement can bury the player (no overlap check — original same).
- One block step is too tall to walk up — jump (the original's floating
  capsule has no auto-step either).
