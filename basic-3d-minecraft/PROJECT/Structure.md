# Structure — basic-3d-minecraft (Incanto)

## `index.html`
Canvas, crosshair, tile bar, ADD CUBE/JUMP buttons, loading overlay.

## `src/game.scene.json`
Environment (sky blue + ambient 1.2), input (move/jump/sprint/addCube),
Voxels (VoxelGrid3D), Terrain node (generator script), Water plane, Player
(RigidBody3D capsule + firstPerson controller + Builder script), Preview
cube, 3 directional lights (sun FollowLight + cool fill + warm under),
camera.

## `src/behaviors.ts`
Terrain (seeded simplex map + chunked trimesh colliders), Builder (raycast
preview + placement), FollowLight. The simplex/LCG implementation mirrors
the original generator.

## `src/main.tsx` and `src/App.tsx`
One `createGame3D` call (behaviors, physics auto, `pointer: true` lock) +
tile-bar UI (writes Builder.selectedTile) + button key injection +
`window.game`.

- `verify.ts` — headless proof that the baked tower is in the grid and solid (`bun run verify`).
