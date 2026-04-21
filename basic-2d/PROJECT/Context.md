# Context — basic-2d

## Project Overview

Minimal React + TypeScript + Vite scaffold for a 2D web app. Renders a single `App` component with a Tailwind-styled counter button — no game loop, no canvas, no rendering library. `@agent8/gameserver` and `lucide-react` are installed but unused.

## Tech Stack

_Exact versions are in `package.json`._

- **Framework**: React, React DOM
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS (via PostCSS + Autoprefixer)
- **Icons (unused)**: `lucide-react`
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

- Asset manifest lives at `src/assets.json` (`{ "images": {} }`) — populate it when adding image assets.
- `index.html` posts `GAME_SIZE_RESPONSE` messages to `window.parent` on load/resize; the host iframe depends on this handshake.
