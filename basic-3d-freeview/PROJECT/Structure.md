# Structure — basic-3d-freeview (Incanto)

## `index.html`

Canvas page: loading overlay with progress bar, JUMP/ATTACK round buttons
(bottom-right), iframe GAME_SIZE harness, module entry.

## `src/game.scene.json`

THE game: environment (sunset preset + white background + ambient 0.7),
gravity, input map (move vector2 WASD+arrows / jump Space / sprint Shift),
assets (base-model + idle/walk/run/runFast/jump mixamo clips), and the tree:
Floor, Player (RigidBody3D + CharacterController3D + ModelInstance3D),
Sun (DirectionalLight3D + FollowLight script), Camera3D.

## `src/behaviors.ts`

FollowLight (sun = player + [30,100,30] every frame) and CharacterAnimator
(listens to the controller's `movementStateChanged`, swaps `skin.animation`).

## `src/main.tsx` and `src/App.tsx`

Preload with progress UI → one `createGame3D` call (behaviors registered,
physics auto, keyboard, `pointer: true` lock-on-click look, renderer, start)
→ button key-injection → `window.game`.
