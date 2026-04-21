# Status — basic-3d-quarterview

## Implemented

- Quarter-view camera following the character (`QuarterViewController` with `followCharacter`)
- Physics-based character controller (`RigidBodyPlayer`) with humanoid animation set (idle, idle_01, walk, run, fast_run, jump, punch, punch_01, kick, kick_01, kick_02, melee_attack, cast, hit, die)
- Combat action layer (`playerActionStore`) with control-lock + `onAnimationComplete` recovery for punch / kick / melee / cast
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + `LoadingScreen`)
- Pre-game asset preloading (`PreloadScene`) covering GLTF, textures, audio, video, and generic URLs from `assets.json`
- Desktop input (keyboard + mouse action buttons) and mobile input (`nipplejs` joystick + on-screen Attack / Jump buttons)
- Collision triggers via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`
- Scene lighting: ambient + `FollowLight` + sunset environment preset
- Position streaming into `localPlayerStore` and rigid-body registration into `multiPlayerStore`

## Installed but not wired

- `@agent8/gameserver` — account hook used for registration only; no networking / session code
- `@react-three/postprocessing` — no effect pipeline
- `lucide-react` — no icon usage in UI yet
- World geometry — only a flat `Floor`
- Death / revive flow — `isDying` / `isRevive` branches in `Player.tsx` are stubbed with `false`
- `onTriggerEnter` / `onTriggerExit` handlers are empty TODOs
