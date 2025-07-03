import { useCallback, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import useCubeStore from '../stores/cubeStore';
import { usePlayerActionStore } from '../stores/playerActionStore';
import throttle from 'lodash/throttle';

// Raycast distance limit constants
const MIN_RAYCAST_DISTANCE = 2;
const MAX_RAYCAST_DISTANCE = 15;

const useCubeRaycaster = () => {
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

        // Here we need to determine the cube position in exactly the same way
        // as the handleCubeClick function in InstancedCube

        // 1. Calculate exact position and face direction
        normal.transformDirection(objectMatrix);

        // 2. Calculate the position of the hit cube (InstancedCube uses integer coordinates)
        // InstancedMesh already uses integer coordinates
        const hitCubeX = Math.round(point.x - normal.x * 0.5);
        const hitCubeY = Math.round(point.y - normal.y * 0.5);
        const hitCubeZ = Math.round(point.z - normal.z * 0.5);

        // 3. Calculate new cube position based on face direction (normal vector)
        // Normalize normal direction to -1, 0, or 1
        const nx = Math.round(normal.x);
        const ny = Math.round(normal.y);
        const nz = Math.round(normal.z);

        // 4. New cube position = hit cube position + normal direction
        // Calculate in the same way as InstancedCube.handleCubeClick
        const x = hitCubeX + nx;
        const y = hitCubeY + ny;
        const z = hitCubeZ + nz;

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
      // previewPosition is already calculated as integer position, so use it as is
      const [x, y, z] = previewPosition;
      addCube(x, y, z, selectedTile);
    }
  }, [previewPosition, addCube, selectedTile]);

  // Subscribe to addCube action from playerActionStore
  useEffect(() => {
    const unsubscribe = usePlayerActionStore.subscribe(
      (state) => state.addCube,
      (addCube) => {
        if (addCube) {
          handleCubeAction();
          // Reset action after handling
          usePlayerActionStore.getState().setPlayerAction('addCube', false);
        }
      },
    );

    return unsubscribe;
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
};

export default useCubeRaycaster;
