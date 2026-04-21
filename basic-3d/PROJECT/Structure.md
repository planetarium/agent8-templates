# Structure — basic-3d

## `src/main.tsx`

Entry point. Mounts `<App />` into `#root` inside `StrictMode`.

## `src/App.tsx`

Root component. Renders a full-viewport container with a single Tailwind-styled counter button. No 3D content.

## `src/App.css`, `src/index.css`

`index.css` holds Tailwind directives (`@tailwind base/components/utilities`); `App.css` contains a minimal `#root` rule.

## `src/assets.json`

Asset manifest. Currently `{ "images": {} }` — empty.

## `src/vite-env.d.ts`

Vite client type reference.

## `index.html`

HTML shell. Includes an inline loading spinner and a `postMessage`-based `GAME_SIZE_RESPONSE` reporter that posts document dimensions to `window.parent` on load, resize, and `REQUEST_GAME_SIZE`.
