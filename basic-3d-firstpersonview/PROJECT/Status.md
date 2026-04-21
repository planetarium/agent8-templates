# Status — basic-3d-firstpersonview

## Implemented

- First-person camera (`FirstPersonViewController`) with invisible local `CharacterRenderer`
- Physics-based character controller (`RigidBodyPlayer`) with extended humanoid animation set (idle, walk, run, fast run, jump, punch, kick, melee attack, cast, hit, dance, swim, die)
- Left-click shooting: camera-forward bullet spawn with cooldown, routed through `effectStore`
- Effect pipeline: `EffectContainer` + `BulletEffectController` + `Bullet` (sensor + raycast) + `MuzzleFlash` + `Explosion` on hit
- FPV crosshair overlay tracked to canvas center
- Physics-ready bootstrap (`MapPhysicsReadyChecker` + `LoadingScreen`)
- Desktop input (keyboard + mouse + pointer lock) and mobile input (`nipplejs` joystick + on-screen ATTACK / JUMP buttons)
- Collision triggers via `RigidBodyPlayer.onTriggerEnter` / `onTriggerExit`
- Scene lighting: ambient + `FollowLight` + sunset environment preset

## Installed but not wired

- `@agent8/gameserver` — `useGameServer().account` is read for player registration, but no networking / session / effect replication code
- `@react-three/postprocessing` — no effect pipeline
- `playerActionStore` fields `punch`, `kick`, `meleeAttack`, `cast` — declared but no input binds or animation triggers (only `attack` is wired)
- `lucide-react` — imported as a dependency but unused in source
- World geometry — only a flat `Floor`
