# [PROJECT TITLE]

## Project Summary

[THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

This project is a template project with a basic 2D. It is implemented using Phaser. It can be used to implement games like boardgame or simple 2d game.

## Implementation Strategy

- [THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

## Implemented Features

- [THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering with React 18's createRoot API
- Imports and applies global CSS

### src/App.tsx

- Root component of the application
- Responsible for loading the GameComponent.

### src/components/GameComponent.tsx

- Sets up the container to start Phaser in HTML and calls createGame from src/game/Game.ts.

### src/game/Game.ts

- Provides the createGame function, which executes `new Phaser.Game(config)` with Phaser settings.

### src/game/scenes/MainScene.ts

- Manages the main scene of the game.

### src/App.css

- Contains component-specific styles for the App component
- Demonstrates how to use component-scoped CSS
