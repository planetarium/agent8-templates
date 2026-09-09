/**
 * basic-3d-firstpersonview on Incanto: the camera IS the eye (pointer-lock
 * look), WASD relative to where you face, Shift sprint, Space jump, and a
 * left-click tracer gun — the body is invisible from inside.
 */
import { assetUrls, preloadUrls } from 'incanto';
import { createGame3D } from 'incanto/3d';
import { useEffect, useRef } from 'react';
import { BulletGun, CharacterAnimator, FollowLight } from './behaviors';
import sceneJson from './game.scene.json';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // StrictMode runs this effect twice against the SAME canvas element, and a
    // second engine on one canvas is two renderers fighting for one context.
    // The flag lives on the element, so it lasts exactly as long as the thing
    // it guards — a page-level game like this one never unmounts otherwise.
    if (!canvas || (canvas as { _incanto?: true })._incanto) return;
    (canvas as { _incanto?: true })._incanto = true;

    void (async () => {
      // preload with the classic progress bar, then boot
      const fill = document.querySelector('#progress') as HTMLElement;
      const text = document.querySelector('#progress-text') as HTMLElement;
      await preloadUrls(assetUrls(sceneJson.assets), (done, total) => {
        const pct = Math.round((done / total) * 100);
        fill.style.width = `${pct}%`;
        text.textContent = `${pct}%`;
      });
      // createGame3D boots everything: register (behaviors included) → load →
      // physics (auto) → keyboard + pointer-lock look → renderer → start.
      const game = await createGame3D({
        debug: import.meta.env.VITE_INCANTO_DEBUG === '1',
        canvas,
        scene: sceneJson,
        behaviors: { FollowLight, CharacterAnimator, BulletGun },
        pointer: true, // lockOnClick — FPS mouse look
      });

      document.querySelector('#loading')?.remove();

      // on-screen JUMP/ATTACK buttons (the originals render them on desktop too)
      for (const [id, code] of [
        ['btn-jump', 'Space'],
        ['btn-attack', 'KeyF'],
      ] as const) {
        const el = document.querySelector(`#${id}`);
        el?.addEventListener('pointerdown', () => game.engine.input.handleKey(code, true));
        el?.addEventListener('pointerup', () => game.engine.input.handleKey(code, false));
      }

      // Console playground for vibe-coding
      Object.assign(window, { game });
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
