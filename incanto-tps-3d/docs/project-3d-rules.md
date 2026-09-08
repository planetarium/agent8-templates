<userRequest>
YOU MUST follow these rules EXACTLY when vibe-coding on this Incanto template:

1. 📖 READ THE SKILLS FIRST: `node_modules/incanto/skills/` is the engine
   manual, version-pinned to what is installed. Start with
   `incanto-building-3d-games.md`, `incanto-3d-character.md`,
   `incanto-gameplay-behaviors.md`, `incanto-environment.md` and
   `incanto-audio.md` — this template composes them —
   and FINISH with `incanto-verifying-your-game.md` (rule 11).
2. 🧱 STRUCTURE IS JSON: scenes, nodes, props, assets, input maps and
   replication all live in `src/*.scene.json`. Add nodes there (or with
   `npx incanto-editor`), NOT by constructing them ad-hoc in code.
3. 🧠 LOGIC IS BEHAVIORS: gameplay code = small TypeScript Behavior classes,
   registered with `registerBehavior('Name', Class)` and attached in JSON via
   `"script": { "name": "Name" }`. Reach for a BUILT-IN gameplay behavior
   before writing your own — this template already uses
   Health, DamageOnContact, Chase, WaveSpawner, ScoreKeeper, and its only custom behaviors are
   `Shoot` and `HudUpdater`.
4. 🔑 UIDS ARE GENERATED: every node uid comes from
   `import { newUid } from 'incanto'`. NEVER invent readable uid strings.
5. 📦 ASSETS ARE DECLARED: `assets` entries need `type` + `url`; reference
   them as `"$key"`. Free extra key-values are preserved — use them to leave
   notes for yourself (license, palette, source prompt).
6. ⬆️ Y IS UP: 3D space is y-UP meters, +Z is "south", rotations are degrees
   (Euler XYZ). Negative gravity falls.
7. 🧲 COLLIDERS ARE PROPS: `"collider": { "shape": "box"|"sphere"|"capsule", … }`
   on a body node — never child shape nodes. Wrong shapes hard-fail at load.
8. 🖥️ THE HUD IS DOM HERE: this template's HUD, crosshair and banner are
   plain HTML in `index.html`, and `HudUpdater` writes the live numbers into
   them (guarded, so headless runs are a no-op). That is a CHOICE, not a
   limit — `HudLayer` + `UiText`/`UiBar` nodes work in 3D scenes too (see
   `incanto-hud.md`, and the `beacon-isle-3d` template). Do not mix them in
   one screen.
9. 🐛 DEBUG WHEN UNSURE: `VITE_INCANTO_DEBUG=1 bun run dev` adds the ☰ debug
   menu — Explorer/Inspector (click a node, see and edit its live props), Logs,
   Stats and Colliders (every physics shape as a wireframe, drawn by the same
   Rapier the game runs). There is NO `VITE_INCANTO_DEBUG=1` URL toggle: it was
   removed as deploy-unsafe. Never ship the env flag on.
10. 🎬 DELTA DISCIPLINE: only write props that differ from defaults — the
    loader treats unknown/garbage props as hard errors, which is your friend.
11. ✅ VERIFY LIKE A USER, THEN READ THE FOUR SIGNALS. `bun run check` and
    `bun run verify` are the start, not the end — you cannot SEE this game, and
    each of these answers a failure that otherwise looks like nothing at all:

    | read | it is not clean when |
    | --- | --- |
    | `bunx incanto-check` | the scene will not load, or renders black (no light) |
    | `stats().errors` | something threw and was skipped to keep the game alive |
    | `assetErrors()` | a model or texture 404'd — the thing is simply not there |
    | `framing` | the camera points the wrong way, or nothing is lit |

    ```bash
    printf 'step 500\nframing\nquit\n' | bunx incanto-play src/game.scene.json
    ```

    `framing` reports what the camera SEES — on screen / off screen / behind it
    — plus what lights the scene and which colliders intersect. `behind` looks
    exactly like "my model did not load"; nothing else can tell you apart.
    Then `bun run dev` and actually PLAY what you changed.
12. 🧯 A THROWN ERROR NO LONGER STOPS THE GAME: a behavior that throws is
    reported once (node, script, phase, file:line) and SKIPPED — your script
    stops, the node it is attached to keeps running, the game plays on. So a
    game that looks fine can still be broken: read `stats().errors`, and
    `engine.resumeErroredNodes()` after you fix it.
</userRequest>
