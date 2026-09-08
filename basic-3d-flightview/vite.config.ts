import react from '@vitejs/plugin-react';
import { incantoLibrary, incantoScenes } from 'incanto/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // react(): the app entry is React — src/main.tsx mounts <App />, and App.tsx
  //   owns the canvas the engine draws into.
  // Dev-server only, and both are why the editor is useful here:
  // - incantoScenes(): validates every *.scene.json the moment you save it,
  //   AND serves this project's scenes, so the editor (☰ debug ▸ edit this
  //   scene ▸ scenes) can open, create and save any scene in the project.
  // - incantoLibrary(): the agent8 asset catalog behind the 📚 buttons.
  plugins: [react(), incantoScenes(), incantoLibrary()],
});
