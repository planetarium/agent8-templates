# Context — basic-3d

## Project Overview

Minimal Vite + React + TypeScript scaffold with Three.js / React Three Fiber and Rapier pre-installed as dependencies. `src/` currently ships only a default `App.tsx` counter component — no `Canvas`, no scene, no stores, no physics are wired. This is a bare starting point for building a 3D app from scratch against a fixed dependency baseline.

## Tech Stack

_Exact versions are in `package.json`._

- **Rendering (installed)**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Physics (installed)**: `@react-three/rapier`, `@dimforge/rapier3d-compat`
- **Post-processing (installed)**: `@react-three/postprocessing`
- **Multiplayer (installed)**: `@agent8/gameserver`
- **State (installed)**: Zustand
- **Icons (installed)**: `lucide-react`
- **Build / Lang**: Vite, TypeScript
- **Styling**: Tailwind CSS

## Critical Memory

- No template-specific runtime invariants. `src/` has no 3D code yet — adopt patterns from sibling `basic-3d-*` templates when introducing a `Canvas`, physics, or stores.
