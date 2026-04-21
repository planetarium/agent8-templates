# Status — basic-3d-sideview

## Implemented

- Fixed side-view camera (`SideViewController`, perspective, character-following, `camDistance={10}`)
- Physics-based character controller (`RigidBodyPlayer`) with humanoid animation set (idle, idle_01, walk, run, fast_run, jump, punch, punch_01, kick, kick_01, kick_02, melee_attack, cast, hit, die)
- Combat action state machine with control lock/unlock around one-shots (`playerActionStore` + `useControllerStore`)
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + in-game `LoadingScreen`)
- Two-phase boot: `PreloadScene` warms every URL from `assets.json` through a shared `THREE.LoadingManager` before `GameScene` mounts
- Seed-based procedural platform strip (`Floor.tsx`, default seed `12345`) with randomized width, depth, height, gap, and y-offset
- Desktop input (keyboard WASD/arrows + Shift run + Space jump + F/G/Q/E and mouse buttons for combat) and mobile input (`nipplejs` joystick on left half + on-screen JUMP / ATTACK buttons)
- Collision triggers via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`
- Scene lighting: ambient + `FollowLight` + sunset `Environment` preset (non-background)
- Local-player position streaming into `localPlayerStore` with a squared-distance threshold

## Installed but not wired

- `@agent8/gameserver` — `useGameServer().account` is read for player registration, but no networking / session code ships
- `@react-three/postprocessing` — no effect pipeline
- `lucide-react` — no icon usage in the current UI
- World geometry beyond the procedural floor strip — no walls, obstacles, items, or enemies despite the enums in `rigidBodyObjectType.ts`
