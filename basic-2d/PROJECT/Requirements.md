# Requirements — basic-2d

## Coding Patterns

- Style with Tailwind utility classes; reserve CSS files for layout primitives (`App.css` scopes `#root`).
- Register image assets in `src/assets.json` rather than importing them ad-hoc.
- Keep the `GAME_SIZE_RESPONSE` postMessage handshake in `index.html` intact when editing the shell.

## Known Issues / Constraints

- No 2D rendering library (Canvas / Phaser / PixiJS) is included — pick and wire one before building game logic.
- `@agent8/gameserver` and `lucide-react` are installed but unused; tree-shaking handles them, but remove if not adopted.
- `StrictMode` double-invokes effects in development — account for this when adding game loops or subscriptions.
