# Context — basic-3d-minecraft (Incanto)

## Project Overview

A voxel sandbox on the Incanto engine: an 80×80 seeded terrain (65k+ blocks)
rendered in ONE instanced draw call with the original's exact 26-tile face
palette and shader (per-face colors, directional shading, darkened edges),
first-person pointer-lock controls on the floating-capsule character,
crosshair raycast with a translucent preview cube, and F/left-click placing
the selected tile. Chunked trimesh colliders follow the player.

## Tech Stack

- `incanto` (`VoxelGrid3D` + `CharacterController3D` firstPerson + trimesh
  colliders + ray normals do the heavy lifting); Vite + TypeScript.

## Critical Memory

- READ THE SKILLS FIRST: `node_modules/incanto/skills/`.
- TERRAIN IS DATA, NOT JSON: `VoxelGrid3D` renders blocks fed at runtime
  (`setBlocks`/`addBlock`/`tileAt`) — the Terrain behavior generates the
  seeded map ('minecraft123', the original's LCG+simplex recipe) and owns
  the chunk colliders (10×10 chunks, radius 3 around the player, exposed
  faces only).
- The palette is `VOXEL_PALETTE` (engine, extracted verbatim from the
  original): tile 1 grass / 2 dirt / 5 bedrock, face order
  front,right,back,left,top,bottom.
- Placement = `physics.castRay` (it returns the hit NORMAL): cube =
  round(point − normal/2), place = cube + round(normal). removeCube is
  intentionally absent — the ORIGINAL maps KeyG/right-click but never
  consumes the action.
- Mouse-down looks DOWN (standard FPS). The engine's firstPerson rig
  handles the sign — don't double-negate pitch in behaviors (ray dir uses
  −sin(pitch)).
- Spawn = highest column near the origin (always above the y=10 water).
- uids are engine-generated (`newUid()` from 'incanto').
- `window.game` exposes the `createGame3D` Game handle in the console
  (`game.engine`, `game.scene`, `game.dispose()`).
