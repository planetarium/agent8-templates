# Status — basic-3d-minecraft (Incanto)

## Implemented

- VoxelGrid3D terrain: 65,661 seeded blocks (80×80, height 5..15, bedrock/
  dirt/grass), one draw call, original shader look (face colors + edge
  darkening + directional shading)
- Chunked trimesh colliders (10×10, radius 3, hidden-face culling, 29
  active at spawn), rebuilt on player chunk change (3-frame throttle) and
  on block edits
- First-person controls (pointer lock, standard FPS pitch), float-capsule
  movement/jump/sprint on the voxel surface
- Crosshair + translucent preview cube at the raycast placement position,
  tinted by the selected tile's top color
- F / left click / ADD CUBE button places; tile bar with 5 tiles; JUMP button
- Water plane y=10, sky-blue background, 3-light setup + FollowLight shadows

## Parity vs the original (measured)

- Block count seeded deterministically; preview/place verified at runtime
  (count +1 at the previewed cell); collision keeps the player on terrain
- Composition: grass tops + dirt cliffs + water + crosshair + bottom tile
  bar + corner buttons — screenshot-compared against the original's look

## A structure baked into the JSON (2026-09-04)

`Voxels.voxels` bakes a 19-block beacon tower at (0, 0–18, −8); the `Terrain` generator
merges it with the noise terrain (`setBlocks([...generated, ...grid.blocks()])`, baked last so
it wins the column). `verify.ts` proves it is in the grid before anything readies, survives the
generator, and is SOLID — a ray from the sky lands on it above the terrain's 15. Composing
the prop found the seed arriving a frame late and wiping generated worlds (engine fix).
