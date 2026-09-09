/**
 * basic-3d — an EMPTY STAGE, not a game: a solid ground, a sun under a physical
 * sky, one marker cube so you can see the scene is on, and a camera framing the
 * origin. It is the place a 3D game that is NOT a character game starts from —
 * a puzzle, a board game, a tower defense, a simulation. Delete the Marker and
 * build. Everything is `src/game.scene.json`; there is no game code here.
 */
import { createGame3D, showBootFailure } from 'incanto/3d';
import { useEffect, useRef } from 'react';
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
      /** Dev-only surfaces: the ☰ debug overlay, and the editor behind it. */
      const DEBUG = import.meta.env.VITE_INCANTO_DEBUG === '1';

      const game = await createGame3D({
        debug: DEBUG,
        // The editor's 📚 buttons, served by `incantoLibrary()` in vite.config.ts.
        // Gated on the same flag: `editor` DEFAULTS to `debug`, so a bare object
        // here would turn the editor on in a production build.
        editor: DEBUG && { library: true },
        canvas,
        scene: sceneJson,
      }).catch((e) => {
        // A rejected boot would otherwise leave the loading card up forever.
        showBootFailure(e);
        throw e;
      });

      // The console handle FIRST: `game.stats()`, `game.assetErrors()`,
      // `game.frame()` and `game.engine.log` are the whole in-page diagnostic
      // surface, and a static build has no other.
      (window as unknown as { game: typeof game }).game = game;

      // The overlay comes down LAST, after any wiring of your own.
      document.querySelector('#loading')?.remove();
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
