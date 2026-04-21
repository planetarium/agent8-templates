# Status — basic-3d

## Implemented

- Vite + React 18 + TypeScript scaffold
- Tailwind CSS pipeline (`index.css` directives, `tailwind.config.js`, `postcss.config.js`)
- ESLint configuration
- Default `App.tsx` counter component
- `index.html` iframe size reporter (`GAME_SIZE_RESPONSE` via `postMessage`)
- Empty `assets.json` manifest

## Installed but not wired

- `three`, `@react-three/fiber`, `@react-three/drei` — no `Canvas` or scene
- `@react-three/rapier`, `@dimforge/rapier3d-compat` — no physics world
- `@react-three/postprocessing` — no effect pipeline
- `zustand` — no stores
- `@agent8/gameserver` — no networking / session code
- `lucide-react` — no icons used
