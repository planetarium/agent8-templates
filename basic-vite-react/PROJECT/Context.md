# Context — basic-vite-react

## Project Overview

Minimal React + TypeScript scaffold built with Vite and Tailwind CSS. `App.tsx` renders a single counter button wired to `useState`; `main.tsx` mounts it with `createRoot` under `StrictMode`. No 3D, no game engine, no networking — this is the baseline that every other template in the repo is derived from.

## Tech Stack

_Exact versions are in `package.json`._

- **Framework**: React, React DOM
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS (autoprefixer)
- **Icons**: `lucide-react`
- **Multiplayer (unwired)**: `@agent8/gameserver`

## Critical Memory

No template-specific runtime invariants. Standard React + Vite conventions apply.
