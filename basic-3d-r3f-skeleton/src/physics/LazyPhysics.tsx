// Rapier is installed but kept out of the first-load bundle: this dynamic
// import becomes its own chunk (wasm included) that is only fetched when
// <LazyPhysics /> actually mounts.
import { lazy, Suspense } from 'react';

const PhysicsDemo = lazy(() => import('./PhysicsDemo'));

export function LazyPhysics() {
  return (
    <Suspense fallback={null}>
      <PhysicsDemo />
    </Suspense>
  );
}
