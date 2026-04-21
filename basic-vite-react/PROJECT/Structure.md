# Structure — basic-vite-react

## `src/main.tsx`

Entry point. Mounts `<App />` into `#root` via `createRoot`, wrapped in `StrictMode`. Imports `index.css`.

## `src/App.tsx`

Root component. Renders a single counter button styled with Tailwind utility classes.

## `src/App.css`

Component-scoped styles for `App` (root layout: max-width, centered, padded).

## `src/index.css`

Global stylesheet — Tailwind `base`, `components`, `utilities` directives only.

## `src/assets.json`

Asset manifest. Empty (`{ "images": {} }`) in the baseline template.
