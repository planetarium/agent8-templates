# Agent8 Templates

Template collection for agent8 projects with automated docs management.

## 📁 Project Structure

This workspace contains multiple template projects:

- `basic-3d*` - 3D template projects using React Three Fiber
- `2d-phaser*` - 2D game templates using Phaser
- `basic-vite*` - Basic Vite React templates
- `docs/` - Shared documentation folder

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd agent8-templates

# No additional dependencies needed - uses Node.js built-in modules
```

## 🧊 R3F 3D Templates (`basic-3d-r3f-*`)

The seven R3F templates are the 3D default: they are the only 3D entries in
`templates.json`, so new 3D projects start from one of them. The Incanto
folders (`basic-3d`, `basic-3d-freeview` and the other `basic-3d-<view>`
folders without `r3f`, and `incanto-*-3d`) and the `*-multiplay` (vibe)
folders are no longer listed; they stay in the repo to support existing
projects built from them. When to delete them is a separate decision.

```bash
npm run templates:check   # templates.json is valid JSON, and every name is a folder (name = path)
```

`basic-3d-r3f-freeview`, `-sideview`, `-quarterview`, `-firstpersonview`,
`-empty`, `-flightview` and `-minecraft` are React Three Fiber templates. Each folder is a complete project
(agent8 copies it as-is), so code that does not depend on the view is
duplicated in every folder. `basic-3d-r3f-freeview` is the source of truth for
that shared code: edit it there, then copy it out.

```bash
npm run 3d:sync    # copy the shared files from basic-3d-r3f-freeview to the other folders
npm run 3d:check   # exit 1 if any copy differs from basic-3d-r3f-freeview
```

Shared files (the list lives in `scripts/sync-3d-shared.js`):

- All folders: `.gitignore`, `index.html`, `postcss.config.js`,
  `tailwind.config.js`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`,
  `src/index.css`, `src/physics/LazyPhysics.tsx`, `src/physics/PhysicsDemo.tsx`,
  and `dependencies` / `devDependencies` in `package.json`.
- Character views (sideview, quarterview, firstpersonview): also
  `src/assets.json`, `src/game/anim.ts`, `src/game/camera.ts`,
  `src/game/camera.test.ts`, `src/game/input.ts`,
  `src/game/player.ts`, `src/game/player.test.ts`, `src/game/world.ts`,
  `src/components/Character.tsx`, `src/components/Level.tsx`,
  `src/components/MobileControls.tsx`.
- minecraft: the controller only — `src/game/anim.ts`, `src/game/camera.ts`,
  `src/game/camera.test.ts`, `src/game/input.ts`,
  `src/game/player.ts`, `src/game/player.test.ts`, `src/game/world.ts`,
  `src/components/Character.tsx` (its assets, terrain and touch buttons are
  its own). flightview and empty: the build files only.

Everything else (`src/config.ts`, `src/App.tsx`, `src/game/state.ts`,
`src/components/Player.tsx`, `src/components/CameraRig.tsx`, `AGENTS.md`,
`PROJECT/`, `README.md`) is per view. `docs:copy` skips these folders: they
carry their own `AGENTS.md` and `PROJECT/` docs.

## 📖 Docs Management

### Copy Docs to Projects

Copy the shared `docs/` folder to all basic-3d projects:

```bash
# Using npm
npm run docs:copy

# Using pnpm
pnpm docs:copy
```

### Remove Docs from Projects

Remove docs folders from all basic-3d projects:

```bash
# Using npm
npm run docs:remove

# Using pnpm
pnpm docs:remove
```
