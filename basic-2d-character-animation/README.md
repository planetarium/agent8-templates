# V8 Phaser Template

This project is a basic template for developing 2D games using Phaser in a V8 project.

### Versions

This template has been updated for:

- [Phaser 3.87.0](https://github.com/phaserjs/phaser)
- [React 18.2.0](https://github.com/facebook/react)
- [Vite 5.3.1](https://github.com/vitejs/vite)
- [TypeScript 5.2.2](https://github.com/microsoft/TypeScript)

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch a development web server |
| `npm run build` | Create a production build in the `dist` folder |
| `npm run dev-nolog` | Launch a development web server without sending anonymous data (see "About log.js" below) |
| `npm run build-nolog` | Create a production build in the `dist` folder without sending anonymous data (see "About log.js" below) |

## VSCode Extensions Guide

| Extension | Description |
|-----------|-------------|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Provides linting for TypeScript & JavaScript to enforce coding standards and best practices. |
| [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Automatically formats code to maintain consistency across the project. |

## Writing Code

After cloning the repo, run `npm install` from your project directory. Then, you can start the local development server by running `npm run dev`.

The local development server runs on `http://localhost:8080` by default. Please see the Vite documentation if you wish to change this, or add SSL support.

Once the server is running you can edit any of the files in the `src` folder. Vite will automatically recompile your code and then reload the browser.

## Template Project Structure

We have provided a default project structure to get you started. This is as follows:

### 🏗 Frontend (React)
- `components/` → React UI components.
- `App.tsx` → The main React component that renders UI and initializes Phaser.
- `index.tsx` → React entry point.
### 🎮 Game (Phaser)
- `game/` → Contains all Phaser-related game logic.
- `game/main.ts` → The Phaser game entry point (game config, start logic).
- `game/scenes/` → Stores different Phaser Scenes (e.g., menu, battle, level).
### ⚙ Game System & Logic
- `game/actors/` → Stores interactive game objects like players, enemies, and NPCs.
- `game/constants/` → Stores reusable constants (e.g., ANIMATION_KEYS, DEPTH_LAYERS).
- `game/core/` → Handles game management, including state handling and events.
- `game/entities/` → Contains abstract classes & reusable entities (e.g., PhysicsEntity, RenderableEntity).
- `game/interfaces/` → TypeScript interfaces for structured game development.
### 🛠 Utilities & UI
- `game/ui/` → In-game UI elements (e.g., HpBar.ts for health bars).
- `game/utils/` → General utility functions.
