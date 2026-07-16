import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  base: "./",
  build: {
    outDir: "dist",
    // Skip gzip-size reporting: our users don't optimize by bundle size,
    // and it only slows the build. Output is byte-identical.
    reportCompressedSize: false,
    // Game bundles (three/phaser) legitimately ship 1-3MB single chunks, so
    // the default 500 kB advisory fires on every build as noise. Keep the
    // warning only for genuinely pathological (5MB+) chunks.
    chunkSizeWarningLimit: 5000,
  },
});
