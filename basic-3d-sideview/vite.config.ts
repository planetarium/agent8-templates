import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    // Skip gzip-size reporting: our users don't optimize by bundle size,
    // and it only slows the build. Output is byte-identical.
    reportCompressedSize: false,
    // The lazy rapier chunk inlines its wasm (~2 MB). It is never part of the
    // first load, so the default 500 kB advisory is noise here.
    chunkSizeWarningLimit: 5000,
  },
});
