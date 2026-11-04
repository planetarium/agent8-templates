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

const ALL = Object.keys(SHEETS) as VfxName[];
const LOCAL = ALL.filter((n) => !SHEETS[n].screenSpace);

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    if (q.get('base')) PixelVfx.baseUrl = q.get('base')!;
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => out.loadErrors.push(`${f.key} ${f.url}`));
    PixelVfx.preload(this, mode === 'all' ? ALL : ['rain']);
  }

  create() {
    this.cameras.main.setBackgroundColor('#1b1f2a');
    if (mode === 'rain') return this.rain();
    this.all();
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
    this.time.delayedCall(7600, () => (out.done = true));
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
