# Status — basic-3d-firstpersonview (Incanto)

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
- Crosshair overlay (12px white plus, black halo), JUMP/ATTACK buttons
  (ATTACK injects KeyF = fire)

## Parity vs the original (measured)

- Eye height 1.64 (body 1 + pivot 0.64), mouse yaw measured live; bullets
  fly/expire on the original timings (200 u/s, 150ms reveal, 500ms life)
- Jump apex ≈ +1.25m with visibly faster falls (fallingGravityScale 2.5)
- Composition: first-person eye view, crosshair center,
  horizon mid-screen, buttons bottom-right — body invisible — screenshot-compared side by side

## Knowing divergences

- ATTACK button fires nothing (original spawns bullets via a stores+R3F
  effect system)
- No camera-blocking pull-in (nothing to block in this scene)
