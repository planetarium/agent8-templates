// Shared mutable game state, read every frame (never put this in React state).

/** Where the player is. <Player> copies it from the ecctrl body every frame; lights and HUD read it. */
export const player = {
  pos: { x: 0, y: 0, z: 0 }, // feet center
};
