# Emberwood — Context

A 3D quest vignette and the **0.8 feature showcase**: every headline capability
that shipped in incanto 0.8 is load-bearing here, in one small, readable game.

## What it plays like

Third-person hero in a sunset village. The Elder (walk up, press **E**) runs a
typewriter dialogue with a real choice; accepting opens the north gate. Through
the gate (fade transition) lies a hedge-maze grove at dusk where three
red-eyed wolves walk patrol routes. Sword-strike them (**click/F** — a glowing
arc), watch them poof, take the portal home, report back: QUEST COMPLETE, play
again button.

## Why it exists (dogfooding map)

| 0.8 feature | Where it carries weight |
|---|---|
| `UiDialogue` + choices | the Elder conversation IS the quest state machine |
| `UiButton` | the play-again button |
| `findPath` + `PathFollow` | wolf patrol rings through the hedge maze |
| `Trail3D` | sword arc |
| `engine.sfx.startVoice('wind')` | live ambience that rises as you run |
| `goToScene` | village ⇄ grove, with the black fade |
| controller `animations` map | idle/walk/run/sprint/jump — zero animation code |
| `startRecording`/`replay` | verify.ts proves bit-identical determinism |
| `auditScene` | both scenes assert zero semantic warnings |
| `parseCells`+`mergeSolidRects` | ONE grid string builds hedge colliders AND routes the wolves |

## Design notes

- The grove maze exists exactly once, as `GROVE_GRID` in behaviors.ts. The
  hedge bodies, the wolves' A* pathfinding and the spawn cells all read that
  one string — change the maze by editing text.
- Cross-scene quest state lives in `src/quest.ts` (a module singleton survives
  `goToScene`; the node tree does not).
- Custom code is three behaviors: VillageDirector, GroveDirector, SwordStrike.
  Movement, camera, animation, NPC proximity, patrol walking, dialogue, HUD —
  all engine built-ins wired in scene JSON.


## Localization (added with the 0.35 localization feature)

The village HUD ships **English and Korean**, declared in one `strings` block in
`village.scene.json` and picked with a `UiLanguageSelect` in the top-right
corner. Switching is live — no reload, no second scene.

One string is deliberately **not** translated: `ui.hint`
(`WASD move · Shift sprint · E talk · click/F strike`). WASD, Shift, E and F are
the letters printed on the keyboard, and a Korean gloss of them is both longer
and less clear. It falls back to English in the Korean build, silently, which is
the documented and intended behaviour — see `incanto-localization.md`.

That is the example doing double duty: it shows the feature working AND shows
the judgement call the feature exists to support.
