# Context — basic-3d (Incanto)

## Project Overview

An EMPTY STAGE on the Incanto engine, not a game: a 40×40 solid ground under a
physical sky with a shadow-casting sun, one marker cube at the origin so the
scene is visibly on, and a camera framing it. It is where a 3D game that is
NOT a character game starts — a puzzle, a board game, a tower defense, an idle
game, a simulation. The six sibling `basic-3d-*` templates are the character
starts. Delete the Marker and build; everything is `src/game.scene.json` and
there is no game code.

## Tech Stack

_Exact versions are in `package.json`._

- **Game engine**: `incanto` (Three.js underneath) — the whole game is scene JSON
- **Build / Lang**: Vite, TypeScript, React (the shell that owns the canvas)

## Critical Memory

- READ THE SKILLS FIRST: `node_modules/incanto/skills/` —
  `incanto-your-first-game.md`, then `incanto-scene-json-authoring.md` before
  writing any JSON, then `incanto-building-3d-games.md` for the node types.
- The Ground is a `StaticBody3D` with a box collider, so anything you add with
  a `RigidBody3D` lands on it — physics turns on by itself the moment a scene
  has a body.
- The sky aims the Sun: `environment.sky` drives the scene's main
  `DirectionalLight3D`, so move the sun by `elevationDeg`/`azimuthDeg`, not
  by the light's `position`.
- uids are engine-generated (`newUid()` from 'incanto') — never hand-write.
- `window.game` is the console handle (`game.stats()`, `game.engine`,
  `game.scene`, `game.dispose()`).
