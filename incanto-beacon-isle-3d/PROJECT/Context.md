# Beacon Isle — Context

**The incanto 3D template.** A complete island action-adventure vertical
slice designed to be COPIED as the starting point for 3D vibe-coding: a
generated world, a real quest loop, enemies with terrain-aware AI, readable
combat, win AND lose states, mobile controls, and a headless verify harness —
all in ~2 files of game code.

## What it plays like

You wash up on a golden-hour island. The lighthouse keeper (walk up, **E**)
asks you to relight three ancient wards. Shades — floating wraiths with
burning eyes — patrol each ward and HUNT you across the island surface when
you come close. Cut them down (**click/F**, a real melee swing with the sword
riding your hand bone), stand at the dark crystal and press **E**: it blazes
back to life. Three lit wards → report back → fireworks over the lighthouse.
The shades bite; at 0 HP the isle takes you and you respawn — lit wards stay lit.

## The template story (why it's built this way)

1. **The world is GENERATED, the game is AUTHORED.** `bun run world` re-emits
   `src/game.scene.json` from `generate-world.ts` (deterministic seeds):
   island terrain, sea, tree groves, grass, flowers, and QUEST SITES picked on
   provably walkable ground (the same `buildTerrainNav` grid the enemies use).
   Change the seed → new island, game logic untouched.
2. **Game code is two behaviors** (`IsleDirector`, `SwordStrike`); everything
   else — movement/camera/animations, NPC proximity, dialogue, HUD, touch
   controls, contact damage, physics — is engine surface declared in JSON.
3. **Verified headlessly**: `bun run verify` plays the whole quest, proves the
   shades hunt, proves death keeps progress, and replays recorded input
   bit-identically.

## Feature map (engine 0.12)

| Feature | Where |
|---|---|
| `generateTerrain` island + Water3D sea | generate-world.ts |
| `buildTerrainNav` + `findPath` | ward-site picking AND shade patrol/hunt AI |
| `BoneAttachment3D` | sword in the right hand |
| `environment.post` + bloom | golden-hour grade, glowing ward crystals |
| input-map `"touch"` keys | joystick + buttons on phones, zero code |
| `UiDialogue`/`UiBar`/`UiBanner` | keeper quest, HP, win/lose |
| `startVoice('wind')` | speed-reactive ambience |
| `startRecording`/`replay` | determinism regression in verify.ts |
