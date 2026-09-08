<userRequest>
YOU MUST follow these rules EXACTLY when vibe-coding on this Incanto template:

1. 📖 READ THE SKILLS FIRST: `node_modules/incanto/skills/` is the engine
   manual, version-pinned to what is installed. Start with
   `incanto-building-3d-games.md` and `incanto-scene-json-authoring.md`.
2. 🧱 STRUCTURE IS JSON: scenes, nodes, props, assets, input maps and
   replication all live in `src/game.scene.json`. Add nodes there (or with
   `npx incanto-editor`), NOT by constructing them ad-hoc in code.
3. 🧠 LOGIC IS BEHAVIORS: gameplay code = small TypeScript Behavior classes,
   registered with `registerBehavior('Name', Class)` and attached in JSON via
   `"script": { "name": "Name" }`. Never reach into nodes from App.tsx except
   for boot-time layout.
4. 🔑 UIDS ARE GENERATED: every node uid comes from
   `import { newUid } from 'incanto'`. NEVER invent readable uid strings.
5. 📦 ASSETS ARE DECLARED: `assets` entries need `type` + `url`; reference
   them as `"$key"`. Free extra key-values are preserved — use them to leave
   notes for yourself (license, palette, source prompt).
6. ⬇️ Y IS DOWN: 2D space is y-down pixels, (0,0) top-left, clockwise degrees.
   Up is POSITIVE y — the opposite of the 2D space.
7. 🧲 COLLIDERS ARE PROPS: `"collider": { "shape": "box"|"sphere"|"capsule", … }`
   on a body node — never child shape nodes. Wrong shapes hard-fail at load.
8. 🐛 DEBUG WHEN UNSURE: `physics.debugDraw = true` (the object
   `enablePhysics3D` returns) draws every collider in the running game.
9. 🎬 DELTA DISCIPLINE: only write props that differ from defaults — the
   loader treats unknown/garbage props as hard errors, which is your friend.
10. ✅ VERIFY LIKE A USER: run `pnpm dev`, open the browser, and actually
    play what you changed before declaring it done.
</userRequest>
