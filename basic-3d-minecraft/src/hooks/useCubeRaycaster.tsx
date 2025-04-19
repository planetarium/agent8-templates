import { useCallback, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useCubeStore } from '../store/cubeStore';
import throttle from 'lodash/throttle';

// Raycast distance limit constants
const MIN_RAYCAST_DISTANCE = 4;
const MAX_RAYCAST_DISTANCE = 15;

export function useCubeRaycaster() {
  const { scene, camera } = useThree();
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  const [faceIndex, setFaceIndex] = useState<number | null>(null);
  const addCube = useCubeStore((state) => state.addCube);
  const selectedTile = useCubeStore((state) => state.selectedTile);

  // Create Raycaster
  const raycaster = new THREE.Raycaster();
  // Set raycast distance limits
  raycaster.near = MIN_RAYCAST_DISTANCE;
  raycaster.far = MAX_RAYCAST_DISTANCE;
  const centerScreen = new THREE.Vector2(0, 0); // Screen center

  // Cast ray from the center of the screen
  const handleRaycast = useCallback(() => {
    raycaster.setFromCamera(centerScreen, camera);

    // Check for intersections with all mesh objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Find collision object (floor or cube only)
    if (intersects.length > 0) {
      // Filter for valid collision objects only
      const validIntersection = intersects.find((intersect) => {
        // Check if the object has a parent object
        if (!intersect.object || !intersect.object.parent) return false;

        // If InstancedMesh (if instanceId exists)
        if (intersect.instanceId !== undefined && intersect.object instanceof THREE.InstancedMesh) {
          return true; // Instance cubes are always treated as valid
        }

        // Check for cube object (userData.isCube is set to true)
        if (intersect.object.userData && intersect.object.userData.isCube === true) {
          return true;
        }

        if (intersect.object.parent.userData && intersect.object.parent.userData.isCube === true) {
          return true;
        }

        // Check for floor object Method 1: Check userData
        if (intersect.object.userData && intersect.object.userData.isFloor === true) {
          return true;
        }

        // Check for floor object Method 2: Check parent's userData
        if (intersect.object.parent.userData && (intersect.object.parent.userData.isFloor === true || intersect.object.parent.userData.type === 'fixed')) {
          // Additional check if it's a floor mesh
          if (intersect.object instanceof THREE.Mesh && intersect.object.geometry instanceof THREE.PlaneGeometry) {
            return true;
          }
        }

        return false;
      });

      if (validIntersection) {
        // Calculate collision point
        const point = validIntersection.point;
        const normal = validIntersection.face?.normal.clone() || new THREE.Vector3(0, 1, 0);
        let objectMatrix = validIntersection.object.matrixWorld;

        // Differentiate between InstancedMesh and cube object
        const isInstancedCube = validIntersection.instanceId !== undefined && validIntersection.object instanceof THREE.InstancedMesh;
        const isFloor =
          (validIntersection.object.userData && validIntersection.object.userData.isFloor === true) ||
          (validIntersection.object.parent.userData && validIntersection.object.parent.userData.isFloor === true);

        // Get instance matrix if InstancedMesh
        if (isInstancedCube) {
          const instancedMesh = validIntersection.object as THREE.InstancedMesh;
          const instanceMatrix = new THREE.Matrix4();
          instancedMesh.getMatrixAt(validIntersection.instanceId!, instanceMatrix);

          // Calculate world matrix of the instance
          const instanceWorldMatrix = new THREE.Matrix4().copy(validIntersection.object.matrixWorld).multiply(instanceMatrix);
          objectMatrix = instanceWorldMatrix;
        }

        // Calculate the position to place the cube based on the direction of the collided face
        normal.transformDirection(objectMatrix);

        // Move slightly in the normal direction from the collision point (by 0.5)
        point.add(normal.multiplyScalar(0.5));

        // Round the position to integer values
        const x = Math.floor(point.x) + 0.5;
        const y = Math.floor(point.y) + 0.5;
        const z = Math.floor(point.z) + 0.5;

        setPreviewPosition([x, y, z]);
        setFaceIndex(validIntersection.faceIndex || 0);
      } else {
        setPreviewPosition(null);
        setFaceIndex(null);
      }
    } else {
      setPreviewPosition(null);
      setFaceIndex(null);
    }
  }, [camera, raycaster, scene]);

  // Create throttled version of handleRaycast function (runs only once every 150ms)
  const throttledRaycast = useRef(throttle(handleRaycast, 150, { leading: true, trailing: true })).current;

  // Cube action handler (always operates in builder mode)
  const handleCubeAction = useCallback(() => {
    if (previewPosition) {
      // Builder mode: Add cube
      addCube(previewPosition[0], previewPosition[1], previewPosition[2], selectedTile);
    }
  }, [previewPosition, addCube, selectedTile]);

  // Mouse click event listener
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click
        handleCubeAction();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [handleCubeAction]);

  // Cancel throttle function on component unmount
  useEffect(() => {
    return () => {
      throttledRaycast.cancel();
    };
  }, [throttledRaycast]);

  // Raycasting update (throttling applied)
  useFrame(() => {
    throttledRaycast();
  });

  return { previewPosition };
}
