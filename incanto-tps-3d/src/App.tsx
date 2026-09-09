/**
 * Vanguard — a 3D THIRD-PERSON shooter built on Incanto. Move with WASD, look
 * with the mouse (click locks the pointer), Shift to sprint, Space to jump,
 * left-click / F to fire your hitscan rifle, R to reload, Enter to restart once
 * the mission ends. The camera rides over
 * your soldier's shoulder (CharacterController3D `view: 'free'`); the crosshair
 * is where you shoot. Clear three waves of chasing enemies to SECURE THE AREA;
 * let them drain your HP to 0 and the MISSION FAILS.
 *
 * The whole loop is composed from built-in gameplay behaviors wired in
 * `game.scene.json` (third-person movement+camera, enemy AI via Chase, contact
 * damage, WaveSpawner, Health, ScoreKeeper). The only custom TypeScript is
 * `Shoot` (the click-to-fire hitscan + face-aim) and `HudUpdater` (the HUD +
 * win/lose banner).
 */
import type { SceneJson } from 'incanto';
import { assetUrls, preloadUrls } from 'incanto';
import { createGame3D, showBootFailure } from 'incanto/3d';
import musicUrl from 'incanto/assets/audio/spells_cast.mp3';
import { useEffect, useRef } from 'react';
import { HudUpdater, Shoot } from './behaviors';
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
      // A bundled clip looped as low ambience (no large music files ship in the
      // package — see incanto-audio.md). vite resolves + hashes the real file.

      /**
       * The sub-scenes this scene `instance:`s — `cover.scene.json` and
       * `pillar.scene.json` — handed to the loader by path. `loadScene` never reads
       * files; vite's `import.meta.glob` gathers every scene beside this one.
       */
      const prefabs = import.meta.glob('./*.scene.json', {
        eager: true,
        import: 'default',
      }) as Record<string, SceneJson>;
      const resolveScene = (path: string): SceneJson | null => prefabs[`./${path}`] ?? null;

      // The soldier is a real GLB character (base-model.glb) animated by mixamo clips
      // (idle/walk/run/jump) — declared in the scene `assets`. Warm the HTTP cache with
      // a progress bar before booting; the arena, enemies, SFX + music stay zero-fetch.
      const fill = document.querySelector('#progress') as HTMLElement | null;
      const text = document.querySelector('#progress-text') as HTMLElement | null;
      await preloadUrls(assetUrls(sceneJson.assets), (done, total) => {
        const pct = total > 0 ? Math.round((done / total) * 100) : 100;
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${pct}%`;
      });
      // createGame3D boots everything: register (gameplay behaviors auto-registered) →
      // load → physics (auto; the scene has bodies) → keyboard + pointer-lock look →
      // renderer → start. We pass the two custom behaviors.
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
        scene: sceneJson,
        resolveScene,
        behaviors: { Shoot, HudUpdater },
        pointer: true, // pointer-lock mouse look (lockOnClick) — drives the free-view yaw/pitch
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

      // And the loading overlay comes down LAST. Everything between here and there is
      // your code; a throw in it used to leave a level that renders perfectly with no
      // player, no error UI, and no way to ask the page what happened.
      try {
        // Looping background music on the music bus (a calm tense pad). The engine
        // auto-resumes a gesture-blocked track on the first click/keypress.
        game.engine.music.play(musicUrl, { loop: true, fadeIn: 1.5 });
        game.engine.audio.music = 0.3;

        // On-screen FIRE / JUMP buttons (mobile + desktop parity).
        for (const [id, code] of [
          ['btn-fire', 'KeyF'],
          ['btn-jump', 'Space'],
        ] as const) {
          const el = document.querySelector(`#${id}`);
          el?.addEventListener('pointerdown', () => game.engine.input.handleKey(code, true));
          el?.addEventListener('pointerup', () => game.engine.input.handleKey(code, false));
        }
      } catch (e) {
        showBootFailure(e);
        throw e;
      }

      document.querySelector('#loading')?.remove();
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
