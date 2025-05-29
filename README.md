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
