import { useEffect, useRef } from 'react';
import { altitude, measuredSpeed } from '../game/flight';
import { plane } from '../game/state';

/** Speed (km/h) and altitude (m), written straight to the DOM 10×/s — no React re-render. */
export function Hud() {
  const speed = useRef<HTMLDivElement>(null);
  const alt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (speed.current) speed.current.textContent = `Speed: ${(measuredSpeed(plane) * 3.6).toFixed(1)} km/h`;
      if (alt.current) alt.current.textContent = `Altitude: ${Math.max(0, altitude(plane)).toFixed(1)} m`;
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none absolute right-3 top-3 rounded bg-black/50 px-3 py-2 font-mono text-xs leading-5 text-white">
      <div ref={speed}>Speed: 0.0 km/h</div>
      <div ref={alt}>Altitude: 0.0 m</div>
    </div>
  );
}
