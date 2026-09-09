# Status — basic-3d-flightview (Incanto)

## Implemented

- Scene: Sky shader (sun [-20,30,10], turbidity 0.8, rayleigh 0.4),
  ambient 1.2, sea 10000² #77aaff / grass 1000² #3d711c / runway 6×1000
  #51595c, procedural plane (7 box parts + propeller), FollowLight shadow
  sun, chase Camera3D fov 30 far 5000
- Behaviors: FlightControl (full constant set + quaternion attitude +
  banking chase cam + bullets + R reset + 5-frame measured speed),
  RunwayMarkings (100 stripes), DecorSpawner (500 ground + 150 floating,
  seed 12345), FollowLight
- HUD panel (Players/Health/Speed/Altitude + controls), bottom hint line

## Parity vs the original (measured)

- SAME HUD VALUE at the same input sequence: ours and the running original
  both read exactly "Speed: 432.0 km/h" at full throttle (120 m/s × 3.6)
- Takeoff: W 3.5s + ↑ 1.2s → altitude 125m; composition screenshot-matched
  (runway/markings/plane/decor/HUD panel)

## Knowing divergences

- No wingtip trails / muzzle flash / explosion particles
- Health/Players are static labels (no gameplay behind them in the
  original either)
