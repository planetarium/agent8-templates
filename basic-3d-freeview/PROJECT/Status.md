# Status — basic-3d-freeview

## Implemented

- Third-person free-view camera (`FreeViewController`)
- Physics-based character controller (`RigidBodyPlayer`) with full humanoid animation set (idle, walk, run, jump, punch, kick, melee attack, cast, hit, dance, swim, die)
- Combat action state machine (`playerActionStore`)
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + `LoadingScreen`)
- Desktop input (keyboard + mouse + pointer lock) and mobile input (`nipplejs` joystick + action buttons)
- Collision triggers via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`
- Scene lighting: ambient + `FollowLight` + sunset environment preset

## Installed but not wired

- `@agent8/gameserver` — no networking / session code
- `@react-three/postprocessing` — no effect pipeline
- World geometry — only a flat `Floor`
