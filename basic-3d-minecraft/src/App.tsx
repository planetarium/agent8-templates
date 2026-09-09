/**
 * basic-3d-minecraft on Incanto: an 80×80 seeded voxel world rendered in one
 * instanced draw call, first-person pointer-lock controls, crosshair raycast
 * with a translucent preview cube, F/left-click places the selected tile.
 */
import { createGame3D, VOXEL_PALETTE } from 'incanto/3d';
import { useEffect, useRef } from 'react';
import { Builder, FollowLight, Terrain } from './behaviors';
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
      // createGame3D boots everything: register (behaviors included) → load →
      // physics (auto) → keyboard + pointer-lock look → renderer → start.
      const game = await createGame3D({
        debug: import.meta.env.VITE_INCANTO_DEBUG === '1',
        canvas,
        scene: sceneJson,
        behaviors: { FollowLight, Terrain, Builder },
        pointer: true, // lockOnClick — FPS mouse look
      });

      document.querySelector('#loading')?.remove();

      // tile bar: 5 selectable tiles (grass, dirt, stone, sand, gold block)
      const TILES = [1, 2, 3, 11, 24];
      const player = game.scene.root.getNodesByName('Player')[0];
      const bar = document.querySelector('#tilebar') as HTMLElement;
      const render = (selected: number): void => {
        bar.innerHTML = '';
        for (const tile of TILES) {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `tile-chip${tile === selected ? ' selected' : ''}`;
          const top = VOXEL_PALETTE[tile]?.[4] ?? [1, 1, 1];
          chip.style.background = `rgb(${Math.round((top[0] as number) * 255)}, ${Math.round((top[1] as number) * 255)}, ${Math.round((top[2] as number) * 255)})`;
          chip.addEventListener('click', () => {
            const builder = player?.behavior as Builder | null;
            if (builder) builder.selectedTile = tile;
            render(tile);
          });
          bar.appendChild(chip);
        }
      };
      render(1);

      for (const [id, code] of [
        ['btn-jump', 'Space'],
        ['btn-attack', 'KeyF'],
      ] as const) {
        const el = document.querySelector(`#${id}`);
        el?.addEventListener('pointerdown', () => game.engine.input.handleKey(code, true));
        el?.addEventListener('pointerup', () => game.engine.input.handleKey(code, false));
      }

      Object.assign(window, { game });
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
