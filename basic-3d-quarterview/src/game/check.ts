// Preview measuring hook — dev server only. <CheckProbe> (inside the Canvas) installs it.
//
// The agent8 preview check measures every element on the screen (how much of the play
// area or the player it covers, overlaps, text cut off, off the screen). The HUD and
// touch controls here are page (DOM) elements, which it measures itself — name them with
// data-a8-touch / data-a8-hud / data-a8-panel / data-a8-notice="<name>". What it cannot
// see on its own is the 3D scene: where the canvas draws and where the player stands on
// the screen. `window.__agent8Check` tells it that. The probe only installs it when
// `import.meta.env.DEV` (the preview's dev server), so the published game has no hook.
import { Vector3, type Camera } from 'three';

export type ScreenRect = { x: number; y: number; w: number; h: number };
/** The player as a box standing on `pos` (its feet): radius across, height up. Metres. */
export type PlayerBox = { pos: { x: number; y: number; z: number }; radius: number; height: number };
type PageBox = { left: number; top: number; width: number; height: number };

const corner = new Vector3();

/**
 * The page rectangle (CSS px) a world box covers on the canvas, or null when no
 * corner is in front of the camera. Clipped to the canvas.
 */
export function projectBox(box: PlayerBox, camera: Camera, canvas: PageBox): ScreenRect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) for (const dy of [0, 1]) {
    corner.set(box.pos.x + dx * box.radius, box.pos.y + dy * box.height, box.pos.z + dz * box.radius).project(camera);
    if (corner.z < -1 || corner.z > 1) continue; // behind the camera or past its far plane
    x0 = Math.min(x0, corner.x); x1 = Math.max(x1, corner.x);
    y0 = Math.min(y0, corner.y); y1 = Math.max(y1, corner.y);
  }
  if (!Number.isFinite(x0)) return null;
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const left = canvas.left + ((clamp(x0) + 1) / 2) * canvas.width;
  const right = canvas.left + ((clamp(x1) + 1) / 2) * canvas.width;
  const top = canvas.top + ((1 - clamp(y1)) / 2) * canvas.height;
  const bottom = canvas.top + ((1 - clamp(y0)) / 2) * canvas.height;
  if (right - left <= 0 || bottom - top <= 0) return null;
  return { x: Math.round(left), y: Math.round(top), w: Math.round(right - left), h: Math.round(bottom - top) };
}

/** What the probe knows each frame. */
export type CheckView = { camera: Camera; canvas: HTMLCanvasElement; frames: number };

/** The object the preview check reads (`window.__agent8Check`, v1). */
export function createCheck(view: () => CheckView | null, player?: () => PlayerBox | null) {
  const box = (canvas: HTMLCanvasElement): PageBox => canvas.getBoundingClientRect();
  return {
    v: 1,
    renderer: 'r3f',
    /** The canvas has drawn a frame. */
    ready: () => (view()?.frames ?? 0) > 0,
    /** Where the canvas draws on the page. */
    viewport: () => {
      const v = view();
      if (!v) return null;
      const b = box(v.canvas);
      return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) };
    },
    /** The player on the screen; null with no player (first person, an empty stage). */
    player: () => {
      const v = view();
      const p = player?.();
      if (!v || !p) return null;
      return { pos: { ...p.pos }, screen: projectBox(p, v.camera, box(v.canvas)) };
    },
    /** Elements drawn inside the canvas: none — the HUD and controls are DOM elements. */
    elements: () => [] as { name: string; kind: string; x: number; y: number; w: number; h: number }[],
  };
}
