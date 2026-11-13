// Camera framing presets: plain data, no imports. config.ts reads this file
// directly so loading config never pulls in camera.ts → world.ts (a map in
// world.ts may import config; see imports.test.ts). camera.ts re-exports it.

export type CameraPreset = 'follow' | 'shoulder' | 'wide';

export type OrbitCamera = {
  /** Default / min / max distance from the focus (m); the wheel zooms between min and max. */
  distance: number;
  minDistance: number;
  maxDistance: number;
  /** Start / min / max pitch (radians above the horizon; negative looks up from below the focus). */
  pitch: number;
  minPitch: number;
  maxPitch: number;
  /** Focus height above the feet (eye level). */
  height: number;
  /** Sideways offset of the camera and focus to the right (m): an over-the-shoulder view. */
  shoulder: number;
  /** Vertical FOV on landscape / portrait screens (degrees). */
  fov: number;
  portraitFov: number;
};

/** Pick one with `CAMERA.preset` in config.ts. */
export const CAMERA_PRESETS: Record<CameraPreset, OrbitCamera> = {
  /** Behind and a little above the character — platformers, adventure, most games. */
  follow: { distance: 4.5, minDistance: 2.5, maxDistance: 10, pitch: 0.18, minPitch: -0.15, maxPitch: 1.1, height: 1.3, shoulder: 0, fov: 65, portraitFov: 75 },
  /** Over the right shoulder, close — third-person shooters (add a crosshair). */
  shoulder: { distance: 3, minDistance: 1.8, maxDistance: 6, pitch: 0.1, minPitch: -0.4, maxPitch: 1.0, height: 1.45, shoulder: 0.6, fov: 60, portraitFov: 70 },
  /** Further back and higher — exploration, building, seeing the ground around you. */
  wide: { distance: 7, minDistance: 3, maxDistance: 16, pitch: 0.3, minPitch: -0.1, maxPitch: 1.2, height: 1.3, shoulder: 0, fov: 65, portraitFov: 75 },
};
