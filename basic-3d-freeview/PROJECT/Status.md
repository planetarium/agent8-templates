# Status — basic-3d-freeview (Incanto)

## Implemented

- Preload screen with a real progress bar over all CDN assets
  (`preloadUrls` + `assetUrls`)
- `game.scene.json`: sunset IBL + white background, gravity −9.81, input map
  (move/jump/sprint), model + 5 mixamo animation assets, Floor
  (StaticBody3D 100×100 + dark-gray skin), Player (dynamic RigidBody3D
  capsule + CharacterController3D `view: "free"` camDistance 4 +
  ModelInstance3D skin), FollowLight sun, current Camera3D
- Behaviors: FollowLight (sun tracks player at [30,100,30]),
  CharacterAnimator (movement state → clip)
- Pointer-lock mouse look, wheel zoom disabled (original parity: min==max)
- JUMP button (injects Space), ATTACK button (visual parity)

## Parity vs the original (measured)

- Walk 2s ≈ 7.6m (target 4 m/s intensity model) — same numbers as the
  original's CharacterController (maxVel 2.5, sprint ×2, accDeltaTime 8)
- Jump apex ≈ +1.25m with visibly faster falls (fallingGravityScale 2.5)
- Composition: white sky, dark floor horizon mid-screen, character center,
  buttons bottom-right — screenshot-compared side by side

## Knowing divergences

- ATTACK button fires nothing (original spawns bullets via a stores+R3F
  effect system)
- No camera-blocking pull-in (nothing to block in this scene)
