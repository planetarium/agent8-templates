# Requirements — basic-3d (Incanto)

## Coding Patterns

- Structure goes in `src/game.scene.json`; behaviours only for what JSON
  cannot say. Prefer a built-in behaviour (`incanto-gameplay-behaviors.md`)
  over a class, and a `connections[]` entry over a listener in code.
- Every prop you write must be one the node type declares — the loader
  hard-fails on an unknown prop or a wrong value kind. `bunx incanto-check src`
  after every scene edit.
- Assets: declare them in the scene's `assets{}` (`type` + `url`) and
  reference them as `$key`. Only known URLs.

## Known Issues / Constraints

- Nothing moves, nothing can be won or lost — by design. This is a stage.
- No input map is declared; add `input` to the scene header when the game
  gets controls.
