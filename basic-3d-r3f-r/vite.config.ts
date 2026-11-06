import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    // ecctrl imports @dimforge/rapier3d-compat without declaring it; resolve
    // every import to the one copy @react-three/rapier uses, or the ~2 MB
    // wasm is bundled twice.
    dedupe: ["@dimforge/rapier3d-compat"],
  },
  build: {
    outDir: "dist",
    // Skip gzip-size reporting: our users don't optimize by bundle size,
    // and it only slows the build. Output is byte-identical.
    reportCompressedSize: false,
    // Rapier (wasm inlined, ~2 MB) is part of the first load in this variant,
    // so the default 500 kB advisory is noise here.
    chunkSizeWarningLimit: 5000,
  },
});
