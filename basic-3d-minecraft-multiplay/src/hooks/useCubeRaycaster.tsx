import { useCallback, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import throttle from 'lodash/throttle';
import { useGameServer } from '@agent8/gameserver';
import { useCubeStore } from '../store/cubeStore';

// Raycast distance limit constants
const MIN_RAYCAST_DISTANCE = 2;
const MAX_RAYCAST_DISTANCE = 15;

export function useCubeRaycaster() {
  const { scene, camera } = useThree();
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  const [faceIndex, setFaceIndex] = useState<number | null>(null);
  const selectedTile = useCubeStore((state) => state.selectedTile);
  const { server } = useGameServer();

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

        // 충돌체 타입 감지 - CuboidCollider 충돌 감지
        const isCuboidCollider =
          validIntersection.object.parent?.userData?.type === 'cubeChunk' || validIntersection.object.parent?.parent?.userData?.type === 'cubeChunk';

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

        // CuboidCollider와의 충돌인 경우 이동 거리 조정
        // CuboidCollider는 이미 경계에서 충돌이 발생하므로 추가 이동이 불필요
        const offsetMultiplier = isCuboidCollider ? 0.01 : 0.5;

        // Move in the normal direction from the collision point by the calculated offset
        point.add(normal.multiplyScalar(offsetMultiplier));

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
      server.remoteFunction('addCube', [[previewPosition[0], previewPosition[1], previewPosition[2]], selectedTile], {
        needResponse: true,
      });
    }
  }, [previewPosition, server, selectedTile]);

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
