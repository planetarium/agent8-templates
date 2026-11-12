# Status — basic-3d-r3f-minecraft

## Implemented

- Seeded 80 × 80 voxel world (grass / dirt / stone), deterministic (tested)
- 10 × 10 chunks; only chunks within radius 3 of the player meshed and
  drawn; exposed faces only; edits rebuild only the touched chunks (and the
  neighbor across a border) (tested)
- Block textures from the verse8 CDN (grass top, grass side, dirt, stone)
- Crosshair raycast (voxel traversal, tested) with a block outline; click
  mines, right-click places, 1 / 2 / 3 pick grass / dirt / stone
- Walk / run / jump with coyote time and input buffer on the blocks;
  1-block steps need a jump; world edge is a wall (tested)
- verse8 base character with retargeted mixamo clips, idle/walk/run/jump/fall
- 3rd-person orbit camera ('wide' preset; follow / shoulder one line away)
  that stays out of the blocks, springs back, and swings behind the motion
- Touch: joystick, MINE / PLACE / JUMP, block bar
- Lazy rapier demo (`?physics=1` or `PHYSICS_DEMO = true`)

## Not yet

- More block types, inventory, saving the world, sound
- Multiplayer (`@agent8/gameserver` unwired)
