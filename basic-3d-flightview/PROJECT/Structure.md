# Structure — basic-3d-flightview (Incanto)

## `index.html`
Canvas + HUD panel (top-left, original styling) + controls hint + loading.

## `src/game.scene.json`
Environment (sky shader + ambient 1.2), input map (throttle/pitch/yaw/
fire/reset), terrain trio (sea/grass/runway), Decor node (spawner script),
Plane (7 box parts + propeller + FlightControl), FollowLight sun, camera.

## `src/behaviors.ts`
FlightControl (attitude quaternion, throttle, rotation authority, chase
camera, bullets, measured speed), RunwayMarkings, DecorSpawner, FollowLight.

## `src/main.tsx` and `src/App.tsx`
One `createGame3D` call (behaviors registered inside; no physics — the scene
has no bodies) + HUD feed (100ms interval) + `window.game`.
