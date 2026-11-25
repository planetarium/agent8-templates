import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { createCheck, type CheckView, type PlayerBox } from '../game/check';

/**
 * Put inside <Canvas>. On the dev server it installs `window.__agent8Check` so the agent8
 * preview check knows where the canvas draws and where the player is on the screen
 * (src/game/check.ts). Renders nothing; does nothing in the published build.
 * `player` returns the player's box (feet position, radius, height), or leave it out
 * when there is no player on the screen (first person, an empty stage).
 */
export function CheckProbe({ player }: { player?: () => PlayerBox | null }) {
  const camera = useThree((s) => s.camera);
  const canvas = useThree((s) => s.gl.domElement);
  const view = useRef<CheckView>({ camera, canvas, frames: 0 });
  view.current.camera = camera;
  view.current.canvas = canvas;
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __agent8Check?: unknown };
    const check = createCheck(
      () => view.current,
      () => playerRef.current?.() ?? null,
    );
    w.__agent8Check = check;
    return () => {
      if (w.__agent8Check === check) delete w.__agent8Check;
    };
  }, []);

  useFrame(() => {
    view.current.frames++;
  });
  return null;
}
