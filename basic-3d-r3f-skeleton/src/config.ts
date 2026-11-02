// Game-wide settings. The view mode is the ONE line that turns this template
// into a freeview (3rd-person orbit) or a sideview (side-scrolling) game.

export type ViewMode = 'freeview' | 'sideview';

/** Pin the template's view here. */
export const VIEW_MODE: ViewMode = 'freeview';

/** Dev convenience: `?mode=sideview` / `?mode=freeview` overrides VIEW_MODE. */
export function resolveViewMode(): ViewMode {
  const q = new URLSearchParams(window.location.search).get('mode');
  return q === 'freeview' || q === 'sideview' ? q : VIEW_MODE;
}

/** Mount the rapier demo (lazy chunk). Off by default so the first load stays light; `?physics=1` also enables it. */
export const PHYSICS_DEMO = false;

export const PLAYER = {
  radius: 0.35,
  height: 1.6,
  runSpeed: 6,
  groundAccel: 60,
  airAccel: 24,
  jumpVelocity: 9,
  gravity: 26,
  maxFall: 30,
  /** Seconds after leaving the ground during which a jump still counts. */
  coyoteTime: 0.12,
  /** Seconds a jump press is remembered (from the moment it was pressed) before landing. */
  jumpBuffer: 0.1,
  /** Falling below this respawns the player. */
  killY: -20,
  spawn: [0, 2, 0] as [number, number, number],
};

export const CAMERA = {
  free: { distance: 8, minDistance: 3, maxDistance: 16, pitch: 0.35, minPitch: -0.1, maxPitch: 1.2, height: 1.2 },
  side: { distance: 12, height: 1.2, lookAhead: 1.5 },
};
