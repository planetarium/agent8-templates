# [PROJECT TITLE]

## Project Summary

[THIS IS TEMPLATE PROJECT, PLEASE UPDATE HERE]

This project is a template project with a basic 2D sprite character. It is implemented using Phaser, and the character has gravity and collision detection applied by default. It can be used to implement games like platformers where characters move on a flat view, stepping on obstacles.

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
- Loads and controls the main character.

### src/game/characters/SpriteCharacter.ts

- Declares a reusable sprite character.
- Implemented by extending `Phaser.Physics.Arcade.Sprite`.

### src/App.css

- Contains component-specific styles for the App component
- Demonstrates how to use component-scoped CSS
