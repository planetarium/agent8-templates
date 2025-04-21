import { useRef, useState, useCallback, useEffect } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { Mesh, Vector3, Raycaster, Vector2, Object3D } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMouseControls } from 'vibe-starter-3d';
import * as THREE from 'three';

// Development mode flag
const isDevelopment = false; // Manually change for debug visualization

interface TargetingSystemProps {
  // No props needed
}

/**
 * TargetingSystem - A targeting system that works independently of terrain
 * Detects click positions in the game and sets movement points.
 */
export const TargetingSystem: React.FC<TargetingSystemProps> = () => {
  const { camera, scene, size } = useThree();
  const getMouseInputs = useMouseControls();
  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);

  // State to check if movement is allowed
  const [canMove, setCanMove] = useState(true);

  // Raycaster to convert screen coordinates to world position
  const raycaster = useRef(new Raycaster());

  // Debug helper for raycaster
  const rayDebugRef = useRef<Object3D | null>(null);

  // Track mouse button state between frames
  const rightPressedLastFrame = useRef(false);
  const clickTimeRef = useRef(0);

  // References for raycaster update and debugging
  const effectRingRef = useRef<Mesh>(null);
  const animationRef = useRef<number | null>(null);

  // Settings for displaying effect at movement point
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  // Movement effect active state
  const [clickEffect, setClickEffect] = useState(false);
  // Movement effect scale adjustment
  const [effectScale, setEffectScale] = useState(1);

  // Function to get world position from mouse coordinates
  const getWorldPositionFromMouse = useCallback(() => {
    const mouseInputs = getMouseInputs();

    // Normalize screen coordinates (to -1 ~ 1 range)
    // It seems mouseControls from vibe-starter-3d returns raw mouse coordinates
    // Need to convert to normalized coordinates
    const normalizedX = (mouseInputs.x / size.width) * 2 - 1;
    const normalizedY = -(mouseInputs.y / size.height) * 2 + 1;

    const mousePosition = new Vector2(normalizedX, normalizedY);
    console.log('Raw mouse position:', { x: mouseInputs.x, y: mouseInputs.y });
    console.log('Normalized mouse position:', { x: normalizedX, y: normalizedY });

    raycaster.current.setFromCamera(mousePosition, camera);

    // Create dedicated raycasting layer for floor (for problem solving)
    const targetingFloor = scene.children.find((child) => child.userData && child.userData.isTargetingFloor === true) as Mesh;

    // If targeting-floor is found
    if (targetingFloor) {
      console.log('Using dedicated targeting floor');
      // Save visibility state
      const wasVisible = targetingFloor.visible;

      // Temporarily set to visible to force raycasting to work
      targetingFloor.visible = true;

      // Check intersection with the targeting floor
      const intersects = raycaster.current.intersectObject(targetingFloor, false);

      // Restore original visibility
      targetingFloor.visible = wasVisible;

      console.log('Intersections with targeting floor:', intersects.length);
      if (intersects.length > 0) {
        console.log('Intersection point with targeting floor:', intersects[0].point);
        return intersects[0].point;
      }
    }

    // Check intersection with all floors (backup method)
    console.log('Trying intersection with all floor objects');
    const allFloors = scene.children.filter((child) => child.userData && (child.userData.isFloor === true || child.userData.type === 'fixed'));

    for (const floor of allFloors) {
      // Temporarily activate visibility
      const wasVisible = floor.visible;
      floor.visible = true;

      const intersects = raycaster.current.intersectObject(floor, true);

      // Restore visibility
      floor.visible = wasVisible;

      if (intersects.length > 0) {
        console.log('Intersection found with floor:', floor.name, intersects[0].point);
        return intersects[0].point;
      }
    }

    // Alternative method: Project ray onto transparent plane at y=0
    console.log('Using fallback plane intersection method');
    const planeIntersection = new Vector3();
    const planeNormal = new Vector3(0, 1, 0);
    const planeConstant = 0; // y = 0 plane
    const ray = raycaster.current.ray;
    console.log('Ray direction:', ray.direction);

    const denominator = planeNormal.dot(ray.direction);
    if (Math.abs(denominator) > 0.0001) {
      const t = -(ray.origin.dot(planeNormal) + planeConstant) / denominator;
      if (t >= 0) {
        planeIntersection.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
        console.log('Fallback intersection point:', planeIntersection);

        // Limit z value if it's too large (restrict to realistic values)
        const maxDistance = 100;
        if (Math.abs(planeIntersection.z) > maxDistance) {
          console.log(`Clamping large z value: ${planeIntersection.z} to max distance: ${maxDistance}`);
          planeIntersection.z = Math.sign(planeIntersection.z) * maxDistance;
        }

        return planeIntersection;
      }
    }

    console.log('Failed to find intersection point');

    // Final fallback method - Project at fixed distance from camera
    const cameraDirection = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const distanceFromCamera = 10; // Fixed distance from camera
    const fixedPoint = new Vector3().copy(camera.position).add(cameraDirection.multiplyScalar(distanceFromCamera));

    console.log('Emergency fallback: Fixed distance from camera:', fixedPoint);
    return fixedPoint;
  }, [camera, scene, getMouseInputs, size]);

  // Movement command execution function
  // Moves character to click position and displays visual effect
  const moveToPosition = useCallback(
    (position: Vector3) => {
      // Don't move if movement is not allowed
      if (!canMove) {
        console.log('Movement currently disabled');
        return;
      }

      console.log('Moving to position:', position);

      // Set movement point in game state (triggers character movement)
      setMoveToPoint(position);

      // Set position for click effect visualization (slightly above the floor)
      setClickPosition(new Vector3(position.x, position.y + 0.01, position.z));
      // Reset effect scale
      setEffectScale(1);
      // Activate click effect
      setClickEffect(true);

      // Prevent consecutive clicks for a short time (prevent click spam)
      setCanMove(false);
      setTimeout(() => {
        setCanMove(true);
      }, 100);
    },
    [canMove, setMoveToPoint],
  );

  // Frame counter (to reduce log frequency)
  const frameCounter = useRef(0);

  // Click effect animation
  useFrame(() => {
    frameCounter.current += 1;

    // Log only every 60 frames to prevent console spam
    const shouldLog = frameCounter.current % 60 === 0;

    // Process click effect animation
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Slowly shrink
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // Adjust circle size
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }

    // Use mouse controls to handle right click
    const mouseInputs = getMouseInputs();
    const right = mouseInputs.right;

    if (shouldLog) {
      console.log('Mouse inputs:', {
        x: mouseInputs.x.toFixed(2),
        y: mouseInputs.y.toFixed(2),
        right: right,
        left: mouseInputs.left,
      });
    }

    const rightJustPressed = right && !rightPressedLastFrame.current;
    const rightJustReleased = !right && rightPressedLastFrame.current;

    // Update button state for next frame
    rightPressedLastFrame.current = right;

    // Handle right click press (start time tracking)
    if (rightJustPressed) {
      clickTimeRef.current = Date.now();
      console.log('Right click pressed');
    }

    // Handle right click release (check if it was a quick click)
    if (rightJustReleased) {
      const clickDuration = Date.now() - clickTimeRef.current;
      console.log('Right click released, duration:', clickDuration, 'ms');

      if (clickDuration < 200) {
        console.log('Processing quick click');
        // Get world position from mouse coordinates
        const point = getWorldPositionFromMouse();

        if (point) {
          // Process through movement function
          moveToPosition(point);
        }
      }
    }
  });

  // Update mouse raycasting and effects every frame
  useEffect(() => {
    // Frame counter (for log frequency control)
    let frameCount = 0;

    // Raycaster update function
    const updateRaycaster = () => {
      if (camera && raycaster.current) {
        // Update logic
      }
    };

    // Animation frame callback function
    const animate = () => {
      // Update raycaster object
      updateRaycaster();

      // Update movement effect animation
      if (clickEffect) {
        // Decrease effect size (fade out effect)
        setEffectScale((prev) => {
          const newScale = prev - 0.02;
          // Disable effect if size becomes smaller than 0
          if (newScale <= 0) {
            setClickEffect(false);
            return 1;
          }
          return newScale;
        });
      }

      // Output debug logs every 30 frames (performance optimization)
      if (isDevelopment && frameCount % 30 === 0) {
        const mouseInputs = getMouseInputs();
        console.log(`Mouse position: ${mouseInputs.x}, ${mouseInputs.y}`);
      }
      frameCount++;

      // Request next animation frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Clean up animation when component unmounts
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, clickEffect, isDevelopment, getMouseInputs]);

  // Viewport click handler function
  const handleViewportClick = useCallback(
    (e: MouseEvent) => {
      // Normalize click position (-1 ~ 1 range)
      const mouseX = (e.clientX / size.width) * 2 - 1;
      const mouseY = -(e.clientY / size.height) * 2 + 1;

      // Update raycaster position
      if (raycaster.current && camera) {
        raycaster.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        // Calculate intersection points with all objects in the scene
        if (scene) {
          const intersects = raycaster.current.intersectObjects(scene.children, true);

          // If there is a first intersection point
          if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            const hitPoint = intersects[0].point;

            // Output more detailed information in debug mode
            if (isDevelopment) {
              console.log('Clicked on:', hitObject.name || 'unnamed object');
              console.log('World position:', hitPoint);
              console.log('Distance:', intersects[0].distance);
              console.log('Face index:', intersects[0].faceIndex);
            }

            // Left click (mouse left button) for movement command
            if (e.button === 0) {
              moveToPosition(hitPoint);
            }
          }
        }
      }
    },
    [camera, scene, isDevelopment, size.width, size.height, moveToPosition],
  );

  return (
    <>
      {/* Minimal click effect circle */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* Thin ring */}
          <meshBasicMaterial color={'#e0e0e0'} transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      {/* Dedicated collision plane for raycasting */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]} // Slightly above the floor
        visible={isDevelopment} // Only visible in development mode
        userData={{ isFloor: true, isTargetingFloor: true }}
        name="targeting-floor"
      >
        <planeGeometry args={[1000, 1000]} /> {/* Much larger plane for better raycasting */}
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.1} />
      </mesh>
    </>
  );
};
