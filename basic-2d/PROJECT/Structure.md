# Structure — basic-2d

## `index.html`

Vite entry HTML. Includes an inline loading spinner shown before React mounts, and a `postMessage` bridge that reports document size to the parent window (`GAME_SIZE_RESPONSE`).

## `src/main.tsx`

React entry. Mounts `<App />` in `StrictMode` into `#root`.

## `src/App.tsx`

Root component. Renders a Tailwind-styled counter button using `useState`.

## `src/App.css`

Component styles for `#root` (centered layout, max-width).

## `src/index.css`

Global base — Tailwind directives only (`@tailwind base/components/utilities`).

## `src/assets.json`

Asset manifest. Empty `images` map by default.

## `src/vite-env.d.ts`

Vite client type reference.

## `public/`

Static assets served as-is (default `vite.svg` favicon).

## Config files

- **`vite.config.ts`** — React plugin, `base: "./"`, `outDir: "dist"`, excludes `lucide-react` from deps optimization.
- **`tailwind.config.js`** — scans `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- **`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`** — TypeScript project references.
- **`postcss.config.js`** — Tailwind + Autoprefixer pipeline.
