# Structure — basic-3d (Incanto)

```
index.html            loading card, #root, the agent8 embed handshake
src/main.tsx          React entry — mounts <App /> into #root
src/App.tsx           createGame3D on one canvas; console handle; overlay down
src/game.scene.json   THE stage: environment (sky, shadows, ambient), Sun,
                      Ground (StaticBody3D + Skin), Marker, Camera
vite.config.ts        react() + incantoScenes() + incantoLibrary()
PROJECT/              this documentation
docs/                 the engine's 3D rules
```

## `src/game.scene.json`

Five nodes under `Stage`: `Sun` (DirectionalLight3D, casts shadows, aimed by
the sky), `Ground` (StaticBody3D 40×40×0.1 with a `Skin` MeshInstance3D that
receives shadows), `Marker` (a 1 m cube at the origin — delete it), `Camera`
(Camera3D, `current`, the engine's documented default framing of the origin).

## `src/App.tsx`

Boots the scene with `createGame3D`, gates the ☰ debug overlay and the editor
on `VITE_INCANTO_DEBUG`, publishes `window.game`, removes `#loading` last.
