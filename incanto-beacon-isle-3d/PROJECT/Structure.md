# Beacon Isle — Structure

```
generate-world.ts        the WORLD AUTHORING script (bun run world):
                         island terrain + sea + groves/grass/flowers +
                         quest sites on walkable ground → src/game.scene.json
index.html               canvas + loading bar
src/main.tsx             React entry — mounts <App /> into #root
src/App.tsx              preload → createGame3D
src/game.scene.json      GENERATED — do not hand-edit; edit generate-world.ts
src/behaviors.ts         IsleDirector (quest FSM, terrain-nav shade AI,
                         ward relighting, fireworks, respawn) + SwordStrike
verify.ts                audit + quest E2E + hunt + death/respawn + replay
```

## Key decisions

- The nav grid is built ONCE in `IsleDirector.onReady` from the live
  Terrain3D; shade hunts re-path every 0.4 s with `findPath` (cheap A*).
- Shades are primitive-built (capsule + gem hood + emissive eyes + Trail3D
  wisp) — zero external meshes, instantly reskinnable.
- Quest state is a module singleton (`quest`) so death → `goToScene` respawn
  keeps lit wards; `IsleDirector.onReady` re-applies their glow.
- The whole Terrain subtree is static EXCEPT Sea and Clouds (auditScene
  catches the freeze-the-water mistake if you regress this).

- `Pad`, `Ball`, `Walker` — the harness's fixtures for a trampoline and a ground chaser on the
  heightfield.
