import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';

/**
 * Component that checks if the map physics is ready by performing raycasting.
 * Casts a ray downward from above to detect map geometry and ensures physics
 * interactions are properly initialized before gameplay begins.
 *
 * - Performs checks every frame until map physics is confirmed ready
 * - Times out after 60 frames as fallback to prevent infinite checking
 * - Excludes Capsule shapes (likely characters/objects) and sensor colliders
 * - Sets mapPhysicsReady to true once valid map geometry is detected
 */
function MapPhysicsReadyChecker() {
  const { isMapPhysicsReady, setMapPhysicsReady } = useGameStore();
  const physicsCheckCount = useRef(0);
  const { rapier, world } = useRapier();

  useFrame(() => {
    if (isMapPhysicsReady) return;

    physicsCheckCount.current++;
    if (physicsCheckCount.current > 180) {
      setMapPhysicsReady(true);
      return;
    }

    const origin = new THREE.Vector3(0, 50, 0);
    const downDirection = new THREE.Vector3(0, -1, 0);
    const ray = new rapier.Ray(origin, downDirection);

    // Get all intersections and find the first non-sensor collider
    const intersections: any[] = [];
    world.propagateModifiedBodyPositionsToColliders();
    world.updateSceneQueries();
    world.intersectionsWithRay(ray, 100, true, (intersection) => {
      // Exclude Capsule shapes as they are unlikely to be map colliders
      if (intersection.collider.shape.type === rapier.ShapeType.Capsule) {
        return true;
      }
      intersections.push(intersection);
      return true; // continue searching
    });

    // Find the first non-sensor collider
    const validHit = intersections.find((intersection) => !intersection.collider.isSensor());
    if (!validHit) return;

    console.log('%c[vibe-starter-3d]%c Map physics initialized.', 'color: #7159c1; font-weight: bold', 'color: inherit;');
    setMapPhysicsReady(true);
  });

  return null;
}

export default MapPhysicsReadyChecker;
