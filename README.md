# Agent8 Templates

Template collection for agent8 projects with automated docs management.

## 📁 Project Structure

This workspace contains multiple template projects:

- `basic-3d`, `basic-3d-<view>` - the 3D templates (React Three Fiber; see below)
- `basic-3d-*-multiplay`, `incanto-*-3d` - older 3D templates, unlisted, kept for existing projects
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

## 🧊 3D Templates (React Three Fiber)

The seven 3D templates are React Three Fiber projects under the existing
names: `basic-3d` (empty stage), `basic-3d-freeview`, `basic-3d-sideview`,
`basic-3d-quarterview`, `basic-3d-firstpersonview`, `basic-3d-flightview` and
`basic-3d-minecraft`. They are the only 3D entries in `templates.json`, so new
3D projects start from one of them. The content-heavy Incanto folders
(`incanto-*-3d`) and the `*-multiplay` (vibe) folders are not listed; they stay
in the repo for existing projects built from them. When to delete them is a
separate decision.

```bash
npm run templates:check   # templates.json is valid JSON, and every name is a folder (name = path)
```

Each folder is a complete project (agent8 copies it as-is), so code that does
not depend on the view is duplicated in every folder. `basic-3d-freeview` is
the source of truth for that shared code: edit it there, then copy it out.

```bash
npm run 3d:sync    # copy the shared files from basic-3d-freeview to the other six folders
npm run 3d:check   # exit 1 if any copy differs from basic-3d-freeview
```

What is shared, and with which folders, is listed in
`scripts/sync-3d-shared.js` (build setup and the import-order test everywhere;
the character controller and camera rules in the character views and
minecraft; the model parts — `fitModel`, `groundClips`, `Props`,
`AnimatedModel`, `anim.ts` and their tests — everywhere). Everything else
(`src/config.ts`, `src/App.tsx`, `src/game/state.ts`, the view's components,
`AGENTS.md`, `PROJECT/`, `README.md`) is per folder. `docs:copy` skips these
seven folders: they carry their own `AGENTS.md` and `PROJECT/` docs.

## 📖 Docs Management

### Copy Docs to Projects

Copy the shared `docs/` folder to the `basic-3d*` projects (the seven 3D templates above are skipped):

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
