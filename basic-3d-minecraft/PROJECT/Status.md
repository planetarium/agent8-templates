# Status — basic-3d-minecraft

## Implemented

- First-person camera + character controller (`FirstPersonViewController` + `RigidBodyPlayer`) with full humanoid animation set (idle, idle-01, walk, run, fast-run, jump, punch, kick, melee attack, cast, hit, die)
- Action state machine (`playerActionStore`) with `lockControls` / `unlockControls` around non-looping animations
- Voxel world: single `InstancedMesh` (capacity 1,000,000) with a custom per-face-color shader and border effect
- Chunk system: 2D X/Z chunking (`CHUNK_SIZE = 10`), camera-distance activation within `ACTIVE_CHUNKS_RADIUS = 3`, cap `MAX_ACTIVE_CHUNKS = 27`, per-chunk merged `TrimeshCollider` with internal-face culling
- Seeded procedural terrain via `simplex-noise` (80×80, centered on origin) with bedrock / dirt / grass layering; regenerable with a new seed
- Screen-center raycaster (`useCubeRaycaster`, throttled 150ms) with translucent `CubePreview` synced to integer placement coordinates
- Block placement via `F` / `Mouse0` (rising-edge through `playerActionStore.addCube`) and via direct pointer click on the instanced mesh
- Tile system: 25 block types (`TILE_TYPES`), 7 color themes (`THEMES`), `TileSelector` with live 3D preview, `Q`/`E` cycle, `T` theme toggle
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + `LoadingScreen`)
- Asset preloader (`PreloadScene`) with per-extension loader dispatch and shared `LoadingManager` progress
- Water plane (visual only) at `y = 10`
- Desktop input (keyboard + mouse + pointer lock) and mobile input (`nipplejs` joystick + `ADD CUBE` / `JUMP` buttons)
- Scene lighting: ambient + three directional lights + `FollowLight` + dawn `Environment`
- Crosshair overlay

## Installed but not wired

- `@agent8/gameserver` — only `account` is read; no session, room, or networking
- `@react-three/postprocessing` — no effect pipeline
- `cubeStore.removeCube` + `removeCube` key bindings (`G` / `Mouse2`) — store action exists, keybindings exist, but `playerActionStore` has no `removeCube` flag and no consumer calls it
- `cubeMapGenerator` extension scaffolds — `BIOMES`, `BIOME_MODIFIERS`, `STRUCTURES`, `getBiomeAt`, `generateStructure`, `generateCaves`, `postProcessCubeMap` are `TODO` stubs
- `Water` has no physics collider
