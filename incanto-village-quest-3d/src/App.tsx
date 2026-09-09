/**
 * Emberwood — a 3D quest vignette showcasing the 0.8 engine surface.
 * Talk to the Elder (UiDialogue + choices), take the quest, sprint through the
 * north gate (goToScene fade) into a hedge-maze grove where three wolves walk
 * A* patrol rings (findPath + PathFollow), fell them with a sword arc
 * (Trail3D), and report back. Wind is a live synth voice (startVoice) that
 * rises as you run; the character animates through the controller's
 * declarative `animations` map — zero animation code.
 */
import { assetUrls, preloadUrls } from 'incanto';
import { createGame3D, showBootFailure } from 'incanto/3d';
import { useEffect, useRef } from 'react';
import { BEHAVIORS } from './behaviors';
import villageJson from './village.scene.json';

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
      const fill = document.querySelector('#progress') as HTMLElement | null;
      const text = document.querySelector('#progress-text') as HTMLElement | null;
      await preloadUrls(assetUrls(villageJson.assets), (done, total) => {
        const pct = total > 0 ? Math.round((done / total) * 100) : 100;
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${pct}%`;
      });
      /** Dev-only surfaces: the ☰ debug overlay, and the editor behind it. */
      const DEBUG = import.meta.env.VITE_INCANTO_DEBUG === '1';

      const game = await createGame3D({
        debug: DEBUG,
        // The editor's 📚 buttons, served by `incantoLibrary()` in vite.config.ts.
        // BOTH halves are the opt-in, and this half was missing from every shipped
        // template: the plugin alone left a vite config whose own comment promised
        // "the agent8 asset catalog behind the 📚 buttons" and no button anywhere.
        // Gated on the same flag, because `editor` DEFAULTS to `debug` and an object
        // here would turn the editor on in a production build.
        editor: DEBUG && { library: true },
        canvas,
        scene: villageJson,
        behaviors: BEHAVIORS,
        pointer: true, // pointer-lock look (click the canvas)
      }).catch((e) => {
        // Without this the player watches the loading overlay sit at 100% forever:
        // `#loading` is removed on the line below, so anything that rejects here (no
        // WebGL context, a scene that will not load) leaves the bar up and the reason
        // in a console nobody opens.
        showBootFailure(e);
        throw e;
      });

      // The console handle FIRST, before any wiring of your own can throw.
      // `game.stats()`, `game.assetErrors()`, `game.frame()` and `game.engine.log`
      // are the entire in-page diagnostic surface, and a static build has no other.
      // Assigned after the wiring, one mistake below took all of them with it.
      (window as unknown as { game: typeof game }).game = game;

      // The overlay comes down LAST, after any wiring of your own. There is none in
      // this template — when you add some, put it above this line and wrap it:
      //
      //   try { …your wiring… } catch (e) { showBootFailure(e); throw e; }
      //
      // A throw between the overlay coming down and the handle going up used to leave
      // a level that renders perfectly with no player and no error of any kind.
      document.querySelector('#loading')?.remove();
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
