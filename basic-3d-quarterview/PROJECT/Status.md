# Status — basic-3d-quarterview (Incanto)

## Implemented

- Preload screen with a real progress bar over all CDN assets
  (`preloadUrls` + `assetUrls`)
- `game.scene.json`: sunset IBL + white background, gravity −9.81, input map
  (move/jump/sprint), model + 5 mixamo animation assets, Floor
  (StaticBody3D 100×100 + dark-gray skin), Player (dynamic RigidBody3D
  capsule + CharacterController3D `view: "quarter"` camDistance 40 (fov 20 camera) +
  ModelInstance3D skin), FollowLight sun, current Camera3D
- Behaviors: FollowLight (sun tracks player at [30,100,30]),
  CharacterAnimator (movement state → clip)
- Fixed camera (no mouse look/zoom — original passes followCharacter only)
- JUMP button (injects Space), ATTACK button (visual parity)

## Parity vs the original (measured)

- Walk 2s ≈ 7.6m (4 m/s); camera follows at EXACTLY (+0, +23.094, +32.660)
  with rotation.x −35.3° — the original's quarter math, unit-tested
- Jump apex ≈ +1.25m with visibly faster falls (fallingGravityScale 2.5)
- Composition: all-floor frame (no horizon at fov 20), centered character
  with a real cast shadow, buttons bottom-right — screenshot-compared side by side

## Knowing divergences

- ATTACK button fires nothing (original spawns bullets via a stores+R3F
  effect system)
- No camera-blocking pull-in (nothing to block in this scene)
