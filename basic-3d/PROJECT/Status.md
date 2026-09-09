# Status — basic-3d (Incanto)

## Implemented

- Physical sky (`atmosphere`, sun at 35° elevation / 140° azimuth), shadows on,
  low ambient so the sky's light does the work
- Sun `DirectionalLight3D` casting shadows over a 30 m area
- Ground: `StaticBody3D` 40×40 with a receiving skin
- Marker cube at the origin (casts a shadow — the visible proof the stage is lit)
- Camera framing the origin from [7, 6, 9]
- React shell, console handle, loading card, agent8 embed handshake

## Next steps

- Delete `Marker`, add the game.
