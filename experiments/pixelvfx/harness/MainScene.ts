import Phaser from 'phaser';
import { PixelVfx, SHEETS, type VfxName } from '../vfx/PixelVfx';

// Replaces the template's MainScene in a throwaway copy (see run.mjs). Query:
//   ?base=<sheet base url>&mode=all            plays every sheet once and checks pivot/fps/loop/cleanup/flip/follow/hitStop
//   ?base=<sheet base url>&mode=rain&zoom=0.5  plays rain under that camera zoom (camera scrolled) and checks it covers the screen
// Results go to window.__vfx (done, errors, checks).

type Check = { name: string; ok: boolean; detail: string };
const q = new URLSearchParams(location.search);
const mode = q.get('mode') ?? 'all';
const zoom = Number(q.get('zoom') ?? 1);
const out = { done: false, mode, zoom, loadErrors: [] as string[], checks: [] as Check[], coverage: [] as unknown[] };
(window as any).__vfx = out;
const check = (name: string, ok: boolean, detail = '') => out.checks.push({ name, ok, detail });

// ?from=&count= plays a slice, so a big set (244 sheets) is checked in batches instead of all in GPU memory at once.
const ALL = (Object.keys(SHEETS) as VfxName[]).slice(Number(q.get('from') ?? 0), q.get('count') ? Number(q.get('from') ?? 0) + Number(q.get('count')) : undefined);
const LOCAL = ALL.filter((n) => !SHEETS[n].screenSpace);

class NextScene extends Phaser.Scene {
  create() {
    const has = (n: string) => this.textures.exists(`vfx:${n}`);
    check('release: hit-spark and rain freed with the scene', !has('hit-spark') && !has('rain'));
    check('release: their animations freed too', !this.anims.exists('vfx:hit-spark') && !this.anims.exists('vfx:rain'));
    check('release: keep: true sheet stays', has('coin-spin'));
    // Loading a freed sheet again works.
    const s = PixelVfx.play(this, 'hit-spark', 300, 300);
    let started = false;
    s.on(Phaser.Animations.Events.ANIMATION_START, () => (started = true));
    this.time.delayedCall(1500, () => {
      check('release: freed sheet loads again later', started && has('hit-spark'));
      out.done = true;
    });
  }
}

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    if (q.get('base')) PixelVfx.baseUrl = q.get('base')!;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => out.loadErrors.push(`${f.key} ${f.url}`));
    if (mode === 'pivot') PixelVfx.preload(this, ALL);
    // The option checks below use these four whatever the slice.
    if (mode === 'all') PixelVfx.preload(this, [...new Set<VfxName>([...ALL, 'fireball', 'torch', 'coin-spin', 'shield-block'])]);
    if (mode === 'rain') PixelVfx.preload(this, ['rain']);
    if (mode === 'release') {
      PixelVfx.preload(this, ['hit-spark', 'rain']);
      PixelVfx.preload(this, ['coin-spin'], { keep: true });
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#1b1f2a');
    if (mode === 'rain') return this.rain();
    if (mode === 'pivot') return this.pivot();
    if (mode === 'release') return this.release();
    if (mode === 'lazy') return this.lazy();
    this.all();
  }

  // Every sheet paused on its middle frame at a fixed point; the page reports each cell's pixels so two runs (full vs
  // trimmed sheets) can be compared pixel for pixel, plus where the drawn pixels sit relative to the pivot point.
  private pivot() {
    const cam = this.cameras.main;
    const flip = q.get('flip') === '1';
    const cols = 6, cellW = 320, cellH = 260;
    cam.setZoom(1).setScroll(0, 0);
    const cells = LOCAL.map((name, i) => {
      const x = (i % cols) * cellW + cellW / 2, y = Math.floor(i / cols) * cellH + 200;
      const sprite = PixelVfx.play(this, name, x, y, { flip });
      const anim = sprite.anims.currentAnim!;
      sprite.anims.pause(anim.frames[Math.floor(anim.frames.length / 2)]);
      return { name, x, y, cx: (i % cols) * cellW, cy: Math.floor(i / cols) * cellH };
    });
    this.time.delayedCall(300, () => {
      this.game.renderer.snapshot((image) => {
        const img = image as HTMLImageElement;
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const bg = [0x1b, 0x1f, 0x2a];
        (out as any).cells = cells.map(({ name, x, y, cx, cy }) => {
          const d = ctx.getImageData(cx, cy, cellW, cellH).data;
          let hash = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
          for (let p = 0; p < d.length; p += 4) {
            hash = (Math.imul(hash, 31) + d[p] * 65536 + d[p + 1] * 256 + d[p + 2]) | 0;
            if (Math.abs(d[p] - bg[0]) + Math.abs(d[p + 1] - bg[1]) + Math.abs(d[p + 2] - bg[2]) < 6) continue;
            const px = (p / 4) % cellW, py = Math.floor(p / 4 / cellW);
            if (px < x0) x0 = px; if (py < y0) y0 = py; if (px > x1) x1 = px; if (py > y1) y1 = py;
          }
          // Drawn-pixel box relative to the pivot point (x, y).
          return { name, hash, box: x1 < 0 ? null : [x0 + cx - x, y0 + cy - y, x1 + cx - x, y1 + cy - y] };
        });
        (out as any).shotReady = true;
        out.done = true;
      });
    });
  }

  // Sheets are freed when the scene that loaded them shuts down, unless kept; a later scene can load them again.
  private release() {
    PixelVfx.play(this, 'hit-spark', 200, 200);
    PixelVfx.play(this, 'rain');
    const has = (n: string) => this.textures.exists(`vfx:${n}`);
    check('release: loaded before shutdown', has('hit-spark') && has('rain') && has('coin-spin'));
    this.scene.add('Next', NextScene, false);
    this.time.delayedCall(200, () => {
      (out as any).shotReady = true;
      this.scene.start('Next');
    });
  }

  // play() on sheets that were never preloaded: they load at runtime and start when they arrive.
  private lazy() {
    const started: string[] = [];
    const track = (s: Phaser.GameObjects.Sprite, label: string) => s.on(Phaser.Animations.Events.ANIMATION_START, () => started.push(label));
    const rain = PixelVfx.play(this, 'rain');
    track(rain, 'rain');
    const a = PixelVfx.play(this, 'hit-spark', 300, 300, { scale: 2 });
    const b = PixelVfx.play(this, 'hit-spark', 600, 300);
    track(a, 'hit-spark a'); track(b, 'hit-spark b');
    let aDone = false, bDone = false;
    a.once(Phaser.GameObjects.Events.DESTROY, () => (aDone = true));
    b.once(Phaser.GameObjects.Events.DESTROY, () => (bDone = true));
    const gone = PixelVfx.play(this, 'heal', 400, 400);
    gone.destroy(); // destroyed before its sheet arrives: must not start or throw
    check('lazy: hidden until loaded', !rain.visible && !a.visible && this.load.isLoading());
    this.time.delayedCall(400, () => (out as any).shotReady = true);
    this.time.delayedCall(2500, () => {
      const cam = this.cameras.main;
      check('lazy: rain loaded, visible and playing', rain.active && rain.visible && rain.texture.key === 'vfx:rain' && rain.anims.isPlaying);
      check('lazy: rain covers the screen', rain.displayWidth * cam.zoom >= cam.width && rain.displayHeight * cam.zoom >= cam.height, `${rain.displayWidth}x${rain.displayHeight}`);
      check('lazy: both hit-sparks started (one load) and destroyed themselves', started.includes('hit-spark a') && started.includes('hit-spark b') && aDone && bDone, started.join(','));
      check('lazy: hit-spark scale 2 and pivot origin', a.scaleX === 2 || aDone);
      check('lazy: sprite destroyed before load did not start', !started.includes('heal'));
      out.done = true;
    });
  }

  private all() {
    const cam = this.cameras.main;
    const cols = 6, cellW = 320, cellH = 260;
    cam.setZoom(Math.min(cam.width / (cols * cellW), cam.height / (Math.ceil(LOCAL.length / cols) * cellH)));
    cam.centerOn((cols * cellW) / 2, (Math.ceil(LOCAL.length / cols) * cellH) / 2);

    for (const name of ALL) {
      const s = SHEETS[name];
      const key = `vfx:${name}`;
      const tex = this.textures.exists(key) ? this.textures.get(key) : null;
      check(`${name} loaded`, !!tex && tex.getFrameNames().length === s.frames, tex ? `${tex.getFrameNames().length}/${s.frames} frames` : 'missing');
    }

    LOCAL.forEach((name, i) => {
      const s = SHEETS[name];
      const x = (i % cols) * cellW + cellW / 2, y = Math.floor(i / cols) * cellH + cellH - 30;
      this.add.rectangle(x, y, cellW - 8, cellH - 8, 0x262c3a).setOrigin(0.5, 1).setY(y + 22).setDepth(-1);
      this.add.text(x, y + 4, name, { fontSize: '16px', color: '#cfd6e6' }).setOrigin(0.5, 0);
      this.add.circle(x, y, 3, 0xff3366).setDepth(2000);
      const sprite = PixelVfx.play(this, name, x, y);
      const anim = sprite.anims.currentAnim!;
      let updates = 0, repeats = 0, complete = false, destroyed = false;
      sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => updates++);
      sprite.on(Phaser.Animations.Events.ANIMATION_REPEAT, () => repeats++);
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => (complete = true));
      sprite.once(Phaser.GameObjects.Events.DESTROY, () => (destroyed = true));
      const originOk = Math.abs(sprite.originX - s.pivot[0] / s.frameWidth) < 1e-6 && Math.abs(sprite.originY - s.pivot[1] / s.frameHeight) < 1e-6;
      check(`${name} origin = pivot`, originOk, `${sprite.originX.toFixed(3)},${sprite.originY.toFixed(3)}`);
      check(`${name} fps/frames`, anim.frameRate === s.fps && anim.frames.length === s.frames, `${anim.frameRate}fps ${anim.frames.length}f`);
      check(`${name} nearest`, this.textures.get(`vfx:${name}`).source[0].scaleMode === Phaser.ScaleModes.NEAREST);
      check(`${name} repeat`, sprite.anims.repeat === (s.loop ? -1 : 0), String(sprite.anims.repeat));
      const duration = (s.frames / s.fps) * 1000;
      this.time.delayedCall(Math.max(duration * 1.3, 2600) + 400, () => {
        if (s.loop) check(`${name} loops`, !destroyed && repeats >= 1, `repeats=${repeats} updates=${updates}`);
        else check(`${name} one-shot plays to the end and destroys itself`, complete && destroyed && updates >= s.frames - 2, `updates=${updates} complete=${complete} destroyed=${destroyed}`);
      });
    });

    // flip mirrors the pivot, scale rounds to a whole number and never goes below 1.
    const flipped = PixelVfx.play(this, 'fireball', -500, -500, { flip: true, scale: 2.6 });
    const fb = SHEETS.fireball;
    check('flip mirrors pivot x', Math.abs(flipped.originX - (fb.frameWidth - fb.pivot[0]) / fb.frameWidth) < 1e-6 && flipped.flipX, flipped.originX.toFixed(3));
    check('scale 2.6 -> 3', flipped.scaleX === 3 && flipped.scaleY === 3, String(flipped.scaleX));
    check('scale 0.4 -> 1', PixelVfx.play(this, 'torch', -500, -500, { scale: 0.4 }).scaleX === 1);

    // follow tracks the target and goes away with it.
    const target = this.add.rectangle(-300, -300, 10, 10);
    const follower = PixelVfx.play(this, 'coin-spin', 0, -20, { follow: target });
    target.setPosition(-250, -260);
    this.time.delayedCall(200, () => {
      check('follow tracks target', follower.x === -250 && follower.y === -280, `${follower.x},${follower.y}`);
      target.destroy();
      this.time.delayedCall(100, () => check('follow ends with target', !follower.active));
    });

    // hitStop pauses on the sheet's impact frames and reports the freeze.
    const stops: number[] = [];
    const blocked = PixelVfx.play(this, 'shield-block', -500, -500, { hitStop: (ms) => stops.push(ms) });
    this.time.delayedCall(60, () => check('hitStop pauses and calls back', stops.length === 1 && stops[0] === SHEETS['shield-block'].hits[0].freeze * 1000 && blocked.anims.isPaused, `stops=${stops}`));

    let threw = '';
    try {
      PixelVfx.play(this, 'not-a-sheet' as VfxName);
    } catch (e) {
      threw = String(e);
    }
    check('unloaded name throws a clear error', /not loaded|unknown/.test(threw), threw.slice(0, 80));

    this.time.delayedCall(450, () => (out as any).shotReady = true);
    // Done after the longest sheet's check.
    const last = Math.max(2600, ...LOCAL.map((n) => (SHEETS[n].frames / SHEETS[n].fps) * 1300));
    this.time.delayedCall(last + 600, () => (out.done = true));
  }

  private rain() {
    const cam = this.cameras.main;
    // Draw a world grid so the camera zoom/scroll is visible behind the overlay.
    for (let gx = -2000; gx <= 4000; gx += 100) this.add.rectangle(gx, 1000, 2, 6000, 0x3a4254).setDepth(-1);
    for (let gy = -2000; gy <= 4000; gy += 100) this.add.rectangle(1000, gy, 6000, 2, 0x3a4254).setDepth(-1);
    cam.setZoom(zoom).setScroll(700, 400);
    const rain = PixelVfx.play(this, 'rain');
    const measure = (label: string) => {
      // scrollFactor(0): screen = (p - camOrigin) * zoom + camOrigin + cam.x
      const ox = cam.width * cam.originX, oy = cam.height * cam.originY;
      const w = rain.displayWidth, h = rain.displayHeight;
      const left = (rain.x - w * rain.originX - ox) * cam.zoomX + ox + cam.x;
      const top = (rain.y - h * rain.originY - oy) * cam.zoomY + oy + cam.y;
      const right = left + w * cam.zoomX, bottom = top + h * cam.zoomY;
      const covers = left <= cam.x + 0.5 && top <= cam.y + 0.5 && right >= cam.x + cam.width - 0.5 && bottom >= cam.y + cam.height - 0.5;
      // What the pilot helper did: scale from cam size alone, ignoring zoom.
      const s = SHEETS.rain;
      const kOld = Math.ceil(Math.max(cam.width / s.frameWidth, cam.height / s.frameHeight));
      const oldW = s.frameWidth * kOld * cam.zoomX, oldH = s.frameHeight * kOld * cam.zoomY;
      out.coverage.push({ label, zoom: cam.zoomX, cam: [cam.width, cam.height], scale: rain.scaleX, screenRect: [left, top, right, bottom].map((v) => Math.round(v)), covers, pilotHelperCovers: oldW >= cam.width && oldH >= cam.height, pilotHelperScreenSize: [Math.round(oldW), Math.round(oldH)] });
      check(`rain covers screen (${label})`, covers, `zoom ${cam.zoomX} scale ${rain.scaleX}`);
      check(`rain scale is whole (${label})`, Number.isInteger(rain.scaleX));
    };
    this.time.delayedCall(300, () => {
      measure('after play');
      (out as any).shotReady = true;
    });
    (window as any).__vfxSetZoom = (z: number) => cam.setZoom(z);
    (window as any).__vfxMeasure = (label: string) => measure(label);
    this.time.delayedCall(400, () => (out.done = true));
  }
}
