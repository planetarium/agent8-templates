# basic-3d-r3f-skeleton

Pilot R3F skeleton for comparing against the Incanto templates
`basic-3d-freeview` and `basic-3d-sideview`. Not registered in
`templates.json`.

Stack: React 19, three, @react-three/fiber 9, @react-three/drei 10,
@react-three/rapier 2 (lazy, not in the first load), Vite, Tailwind.

## Run

```bash
bun install
bun run dev          # http://localhost:5173  (?mode=sideview, ?touch=1, ?physics=1)
bun run build && bun run preview
```

## Pinning the view mode

One line in `src/config.ts`:

```ts
export const VIEW_MODE: ViewMode = 'freeview'; // or 'sideview'
```

To make two starting templates, copy this folder and change only that line
in the copy (e.g. `basic-3d-r3f-freeview/` keeps `'freeview'`,
`basic-3d-r3f-sideview/` gets `'sideview'`). Nothing else differs between
them. For a quick check without editing, open `/?mode=sideview`.

## Controls

| | freeview | sideview |
| --- | --- | --- |
| Desktop | WASD / arrows move (camera-relative), Space jump, drag to orbit, wheel to zoom | A/D or ←/→ move, Space jump |
| Touch | joystick (bottom-left), JUMP (bottom-right), drag the scene to orbit | joystick (horizontal only), JUMP |
