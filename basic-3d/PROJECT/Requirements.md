# Requirements — basic-3d

## Coding Patterns

- Keep the dependency baseline in `package.json` intact; add new code against the already-installed libraries before introducing new ones.
- Register image/model/animation URLs in `src/assets.json` instead of hard-coding paths.
- Use Tailwind utility classes (already wired via `index.css`) for styling; avoid ad-hoc global CSS.

## Known Issues / Constraints

- No 3D scene, `Canvas`, stores, or physics bootstrap exist yet — adding any of these requires wiring from scratch.
- `vibe-starter-3d` is **not** installed; character-controller helpers used by sibling templates (`RigidBodyPlayer`, `FreeViewController`, etc.) are unavailable unless added explicitly.
- `index.html` posts `GAME_SIZE_RESPONSE` messages to `window.parent`; preserve this handler when hosting inside an iframe.
