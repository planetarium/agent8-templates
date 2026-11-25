/// <reference types="vite/client" />
/**
 * Preview measuring hook — dev server only.
 *
 * The agent8 preview check measures every element on the screen (how much of
 * the play area it covers, overlaps, text cut off, off the screen). It reads
 * page (DOM) elements itself; what this game draws inside the Phaser canvas it
 * only sees through `window.__agent8Check`, which `installCheck` (called from
 * Game.ts) puts there. `import.meta.env.DEV` is false in `vite build`, so the
 * published game has no hook and every function here does nothing.
 *
 * Collected on their own: Text objects, objects pinned to the screen
 * (setScrollFactor(0)), and objects with input enabled (counted as controls).
 * Graphics have no bounds, so what you draw with Graphics is not seen — label it
 * with markUiRect. Label anything the guess would get wrong:
 *
 *   markUi(this.scoreText, 'score', 'hud');
 *   markUi(this.waveBanner, 'wave banner', 'notice');  // shows briefly: not judged as a panel
 *   markUiRect(this, 'jump', 'control', () => this.jumpButtonRect);  // drawn with Graphics, screen px
 *   markPlayer(this.player);
 *
 * Kinds: control = something to press, hud = a value display, panel = anything
 * else, notice = meant to show only briefly (a countdown, a wave banner).
 */
import Phaser from 'phaser';

export type UiKind = 'control' | 'hud' | 'panel' | 'notice';
/** Screen pixels of the game (the same space as pointer.x / pointer.y). */
export type UiRect = { x: number; y: number; w: number; h: number };

type Item = { name: string; kind: UiKind; x: number; y: number; w: number; h: number; marked: boolean; named: boolean };

const marks = new WeakMap<object, { name: string; kind: UiKind }>();
const drawn = new WeakMap<Phaser.Scene, Map<string, { kind: UiKind; rect: () => UiRect | null | undefined }>>();
let playerObject: Phaser.GameObjects.GameObject | null = null;

/** Name an object on the screen and say what it is. Returns the object. */
export function markUi<T extends Phaser.GameObjects.GameObject>(object: T, name: string, kind: UiKind): T {
  if (!import.meta.env.DEV) return object;
  marks.set(object, { name, kind });
  return object;
}

/** An element with no object of its own (a button drawn with Graphics): its rectangle in screen px. */
export function markUiRect(scene: Phaser.Scene, name: string, kind: UiKind, rect: () => UiRect | null | undefined) {
  if (!import.meta.env.DEV) return;
  let list = drawn.get(scene);
  if (!list) drawn.set(scene, (list = new Map()));
  list.set(name, { kind, rect });
}

/** The player object (without it the check guesses: the scene's `player`, then what the camera follows). */
export function markPlayer(object: Phaser.GameObjects.GameObject) {
  if (!import.meta.env.DEV) return;
  playerObject = object;
}

const BACKGROUND_SHARE = 0.85; // an unlabelled object covering more of the view than this is a background
const MERGE_SHARE = 0.9; // an unlabelled object this much inside another is part of it (a label on a panel)
const MIN_PLAYER_PX = 8; // a smaller "player" is a proxy (an invisible follow point), not the player
const MAX_ITEMS = 80;

const area = (r: UiRect) => Math.max(0, r.w) * Math.max(0, r.h);
const intersect = (a: UiRect, b: UiRect): UiRect => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
};

export function installCheck(game: Phaser.Game) {
  if (!import.meta.env.DEV) return;
  const matrix = new Phaser.GameObjects.Components.TransformMatrix();
  const point = new Phaser.Math.Vector2();

  const scenes = () => (game.isBooted && !(game as any).pendingDestroy ? game.scene.getScenes(true) : []);
  /** Game screen px → page CSS px (the canvas may be scaled or offset on the page). */
  const toPage = (r: UiRect): UiRect => {
    const box = game.canvas.getBoundingClientRect();
    const sx = box.width / (game.scale.width || box.width || 1);
    const sy = box.height / (game.scale.height || box.height || 1);
    return { x: Math.round(box.left + r.x * sx), y: Math.round(box.top + r.y * sy), w: Math.round(r.w * sx), h: Math.round(r.h * sy) };
  };
  const view = (cam: Phaser.Cameras.Scene2D.Camera): UiRect => ({ x: cam.x, y: cam.y, w: cam.width, h: cam.height });
  /** An object's screen rectangle through the camera, with its (top container's) scroll factor. */
  const onScreen = (obj: any, top: any, cam: Phaser.Cameras.Scene2D.Camera): UiRect | null => {
    if (typeof obj.getBounds !== 'function') return null;
    const b = obj.getBounds();
    const src = top ?? obj;
    matrix.copyWithScrollFactorFrom(cam.matrixCombined, cam.scrollX, cam.scrollY, src.scrollFactorX ?? 1, src.scrollFactorY ?? 1);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [px, py] of [[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]]) {
      matrix.transformPoint(px, py, point);
      x0 = Math.min(x0, point.x); y0 = Math.min(y0, point.y); x1 = Math.max(x1, point.x); y1 = Math.max(y1, point.y);
    }
    return Number.isFinite(x0 + y0 + x1 + y1) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  };
  const textOf = (obj: any) => (typeof obj.text === 'string' ? obj.text.replace(/\s+/g, ' ').trim() : '');
  const quoted = (t: string) => `"${t.slice(0, 24)}${t.length > 24 ? '…' : ''}"`;
  const alive = (obj: any) => !!obj && obj.active !== false && !!obj.scene?.sys?.isActive?.();

  const findPlayer = (): { obj: any; cam: Phaser.Cameras.Scene2D.Camera } | null => {
    const tries: any[] = [];
    if (alive(playerObject)) tries.push(playerObject);
    for (const scene of scenes()) tries.push((scene as any).player, (scene.cameras.main as any)._follow);
    for (const obj of tries) {
      if (!alive(obj) || typeof obj.getBounds !== 'function') continue;
      const b = obj.getBounds();
      if (b.width >= MIN_PLAYER_PX && b.height >= MIN_PLAYER_PX) return { obj, cam: obj.scene.cameras.main };
    }
    return null;
  };

  const collect = (): Item[] => {
    const items: Item[] = [];
    const player = findPlayer()?.obj ?? null;
    for (const scene of scenes()) {
      const cam = scene.cameras.main;
      const camView = view(cam);
      const visit = (obj: any, top: any) => {
        if (items.length >= MAX_ITEMS || obj === player) return;
        if (typeof obj.willRender === 'function' ? !obj.willRender(cam) : obj.visible === false) return;
        const mark = marks.get(obj);
        const text = textOf(obj);
        const isText = obj.type === 'Text' || obj.type === 'BitmapText';
        const fixed = ((top ?? obj).scrollFactorX ?? 1) === 0 && ((top ?? obj).scrollFactorY ?? 1) === 0;
        const control = !!obj.input?.enabled;
        const isContainer = obj instanceof Phaser.GameObjects.Container;
        const auto = !mark && (control || (isText && text !== '') || (fixed && !isContainer));
        if (mark || auto) {
          const r = onScreen(obj, top, cam);
          if (r && area(r) > 0) {
            const seen = intersect(r, camView);
            const keep = mark || (area(seen) > 0 && (isText || area(r) < BACKGROUND_SHARE * area(camView)));
            if (keep) {
              // Labelled and pinned objects are reported where they are (off the screen counts);
              // an unlabelled world object only where the camera shows it.
              const shown = mark || fixed ? r : seen;
              const name = mark?.name ?? (text ? quoted(text) : `${String(obj.type).toLowerCase()}${obj.texture?.key && !obj.texture.key.startsWith('__') ? ` ${obj.texture.key}` : ''}`);
              items.push({ name, kind: mark?.kind ?? (control ? 'control' : 'panel'), ...shown, marked: !!mark, named: !!mark || !!text });
              return;
            }
          }
        }
        if (isContainer) for (const child of obj.list) visit(child, top ?? obj);
      };
      for (const obj of scene.children.list) visit(obj, null);
      for (const [name, entry] of drawn.get(scene) ?? []) {
        const r = entry.rect();
        if (r && area(r) > 0) items.push({ name, kind: entry.kind, ...r, marked: true, named: true });
      }
    }
    // One element per thing on the screen: an unlabelled object inside another (a label on a
    // panel, an icon on a button) joins it instead of being counted as an overlap.
    const sorted = items.sort((a, b) => area(b) - area(a));
    const kept: Item[] = [];
    for (const item of sorted) {
      const host = item.marked ? undefined : kept.find((k) => area(intersect(item, k)) >= MERGE_SHARE * area(item));
      if (!host) {
        kept.push(item);
        continue;
      }
      if (!host.marked && !host.named && item.named) {
        host.name = item.name;
        host.named = true;
      }
      if (!host.marked && item.kind === 'control') host.kind = 'control';
    }
    return kept;
  };

  (window as any).__agent8Check = {
    v: 1,
    renderer: 'phaser',
    ready: () => scenes().length > 0,
    viewport: () => {
      const cams = scenes().map((s) => view(s.cameras.main));
      const largest = cams.sort((a, b) => area(b) - area(a))[0];
      return largest ? toPage(largest) : null;
    },
    player: () => {
      const found = findPlayer();
      if (!found) return null;
      const r = onScreen(found.obj, found.obj.parentContainer ?? null, found.cam);
      return r ? { pos: { x: found.obj.x, y: found.obj.y }, screen: toPage(r) } : null;
    },
    elements: () => collect().map(({ name, kind, x, y, w, h }) => ({ name, kind, ...toPage({ x, y, w, h }) })),
  };
}
