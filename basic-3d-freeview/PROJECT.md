# Basic 3D Free View

## Project Summary

This project is a basic 3D viewer that allows users to freely view 3D objects. It provides functionality to rotate around objects in 3D space, zoom in/out, and move using the mouse. Users can explore 3D models from various angles.

## Implementation Strategy

This project uses a **Three.js-based 3D approach** because:

- Free rotation and manipulation of 3D objects is required
- Three.js provides efficient 3D rendering in web browsers
- React Three Fiber simplifies integration with React components
- Intuitive controls can be implemented for camera manipulation and interaction

Key technologies:

- Three.js for 3D rendering
- React Three Fiber for React integration
- @react-three/drei for useful Three.js helper components
- Responsive design to support various screen sizes
- State management for storing camera positions and object settings

## Implemented Features

- Free orbit camera controls
- Zoom functionality
- 3D object rotation and movement
- Various lighting settings
- Object wireframe mode toggle
- Different background options
- Basic 3D model loading
- Intuitive user interface
- Camera position presets saving and loading
- Screenshot capture functionality

## File Structure Overview

### src/main.tsx

- Entry point for the application
- Sets up React rendering

### src/App.tsx

- Main application component
- Configures the root layout

### src/assets.json

- Defines assets like 3D models and textures
- Maps resource URLs

### src/components/R3F.tsx

- React Three Fiber wrapper component
- Provides 3D environment setup

### src/components/UI.tsx

- User interface component
- Renders control panels and option menus

### src/components/r3f/Scene.tsx

- Main 3D scene component
- Sets up environment and lighting
- Integrates 3D objects

### src/components/r3f/Controls.tsx

- Camera control logic
- Handles mouse and touch events
- Implements zoom, rotation, and movement functionality

### src/components/r3f/Model.tsx

- Loads and renders 3D models
- Sets up model materials and properties
- Supports wireframe and texture modes

### src/components/r3f/Lighting.tsx

- Provides various lighting settings
- Configures ambient, directional, and point lights
- Sets up shadows

### src/components/r3f/Environment.tsx

- Background and environment-related settings
- Supports HDRI backgrounds
- Solid color and gradient background options
