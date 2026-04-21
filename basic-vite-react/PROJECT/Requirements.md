# Requirements — basic-vite-react

## Coding Patterns

- Function components with hooks; no class components.
- Style via Tailwind utility classes in JSX; keep custom CSS minimal and scoped (`App.css` for component, `index.css` for globals/Tailwind directives).
- Register new image/asset URLs under `src/assets.json` rather than hardcoding.

## Known Issues / Constraints

- Baseline template — no routing, no state management library, no networking layer wired up.
- `@agent8/gameserver` and `lucide-react` are installed but not imported anywhere.
