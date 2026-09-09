/**
 * basic-3d-flightview on Incanto: a procedural airplane on a 1000m runway
 * under an atmospheric sky. W/S throttle, arrows pitch & roll, A/D yaw,
 * Space fires, R resets — with the original's exact flight constants and
 * banking chase camera.
 */
import { createGame3D } from 'incanto/3d';
import { useEffect, useRef } from 'react';
import { DecorSpawner, FlightControl, FollowLight, RunwayMarkings } from './behaviors';
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
      // physics (auto — this scene has no bodies) → keyboard → renderer → start.
      const game = await createGame3D({
        debug: import.meta.env.VITE_INCANTO_DEBUG === '1',
        canvas,
        scene: sceneJson,
        behaviors: { FlightControl, FollowLight, RunwayMarkings, DecorSpawner },
      });

      document.querySelector('#loading')?.remove();

      // speed HUD (km/h from the 5-frame measured average — original parity)
      const speedEl = document.querySelector('#speed') as HTMLElement;
      const altEl = document.querySelector('#altitude') as HTMLElement;
      const plane = game.scene.root.getNodesByName('Plane')[0];
      setInterval(() => {
        const fc = plane?.behavior as FlightControl | null;
        speedEl.textContent = `Speed: ${((fc?.measuredSpeed ?? 0) * 3.6).toFixed(1)} km/h`;
        altEl.textContent = `Altitude: ${Math.max(0, (((plane as { position?: number[] })?.position?.[1] ?? 0.3) as number) - 0.3).toFixed(1)} m`;
      }, 100);

      Object.assign(window, { game });
    })();
  }, []);

  return <canvas ref={canvasRef} id="game" />;
}
