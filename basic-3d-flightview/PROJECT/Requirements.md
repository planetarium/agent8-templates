# Requirements — basic-3d-flightview (Incanto)

## Coding Patterns

- STRUCTURE (terrain, plane parts, camera, lights) in `game.scene.json`;
  flight/decor/markings LOGIC in behaviors.
- The plane is box-meshes under one Node3D — extend its look by adding
  MeshInstance3D children (sizes are original-spec × 3).
- New HUD entries: extend `#hud` in index.html and feed them from the
  100ms interval in App.tsx.
- Tune flight feel via the constants atop `behaviors.ts` — they are
  document parity values; note divergences in Status.md if changed.

## Known Issues / Constraints

- No physics bodies: the plane is kinematic (original parity — its rapier
  body was kinematicPosition too); bullets raycast nothing here (no
  targets exist), they just expire.
- Wingtip trails and muzzle flash are not implemented (drei <Trail>
  equivalent pending).
- No multiplayer (Players: 0 is static, like an empty original room).
