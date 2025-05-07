import { useRef, useState, useCallback, useEffect } from 'react';
import { Mesh, Vector3, Raycaster, Vector2 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMouseControls, useControllerState } from 'vibe-starter-3d';

// Development mode flag
const isDevelopment = false; // Manually change for debug visualization

/**
 * PointingSystem - A poin system that works independently of terrain
 * Detects click positions in the game and sets movement points.
 */
const PointingSystem: React.FC = () => {
  const { camera, scene, size } = useThree();
  const getMouseInputs = useMouseControls();
  const { setMoveToPoint } = useControllerState();

  // Movement permission state
  const [canMove, setCanMove] = useState(true);

  // Raycaster to convert screen coordinates to world positions
  const raycaster = useRef(new Raycaster());

  // Track mouse button states between frames
  const rightPressedLastFrame = useRef(false);
  const clickTimeRef = useRef(0);

  // References for raycaster updates and debugging
  const effectRingRef = useRef<Mesh>(null);
  const animationRef = useRef<number | null>(null);

  // Settings for displaying effects at the movement point
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  // Movement effect activation state
  const [clickEffect, setClickEffect] = useState(false);
  // Movement effect size adjustment
  const [effectScale, setEffectScale] = useState(1);

  // Function to get world position from mouse coordinates
  const getWorldPositionFromMouse = useCallback(() => {
    const mouseInputs = getMouseInputs();

    // Normalize screen coordinates (to -1 ~ 1 range)
    const normalizedX = (mouseInputs.x / size.width) * 2 - 1;
    const normalizedY = -(mouseInputs.y / size.height) * 2 + 1;

    const mousePosition = new Vector2(normalizedX, normalizedY);

    if (isDevelopment) {
      console.log('Raw mouse position:', { x: mouseInputs.x, y: mouseInputs.y });
      console.log('Normalized mouse position:', { x: normalizedX, y: normalizedY });
    }

    raycaster.current.setFromCamera(mousePosition, camera);

    // Create dedicated layer for floor raycasting
    const targetingFloor = scene.children.find((child) => child.userData && child.userData.isTargetingFloor === true) as Mesh;

    // If targeting floor is found
    if (targetingFloor) {
      if (isDevelopment) console.log('Using dedicated targeting floor');

      // Save visibility state
      const wasVisible = targetingFloor.visible;

      // Temporarily set to visible for raycasting to work
      targetingFloor.visible = true;

      // Check for intersection with targeting floor
      const intersects = raycaster.current.intersectObject(targetingFloor, false);

      // Restore original visibility
      targetingFloor.visible = wasVisible;

      if (isDevelopment) console.log('Intersections with targeting floor:', intersects.length);

      if (intersects.length > 0) {
        if (isDevelopment) console.log('Intersection point with targeting floor:', intersects[0].point);
        return intersects[0].point;
      }
    }

    // Check for intersections with all floors (backup method)
    if (isDevelopment) console.log('Trying intersection with all floor objects');

    const allFloors = scene.children.filter((child) => child.userData && (child.userData.isFloor === true || child.userData.type === 'fixed'));

    for (const floor of allFloors) {
      // Temporarily enable visibility
      const wasVisible = floor.visible;
      floor.visible = true;

      const intersects = raycaster.current.intersectObject(floor, true);

      // Restore visibility
      floor.visible = wasVisible;

      if (intersects.length > 0) {
        if (isDevelopment) console.log('Intersection found with floor:', floor.name, intersects[0].point);
        return intersects[0].point;
      }
    }

    // Alternative method: Project ray onto y=0 plane
    if (isDevelopment) console.log('Using fallback plane intersection method');

    const planeIntersection = new Vector3();
    const planeNormal = new Vector3(0, 1, 0);
    const planeConstant = 0; // y = 0 plane
    const ray = raycaster.current.ray;

    if (isDevelopment) console.log('Ray direction:', ray.direction);

    const denominator = planeNormal.dot(ray.direction);
    if (Math.abs(denominator) > 0.0001) {
      const t = -(ray.origin.dot(planeNormal) + planeConstant) / denominator;
      if (t >= 0) {
        planeIntersection.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
        if (isDevelopment) console.log('Fallback intersection point:', planeIntersection);

        // Limit z value if it's too large (restrict to realistic values)
        const maxDistance = 100;
        if (Math.abs(planeIntersection.z) > maxDistance) {
          if (isDevelopment) console.log(`Clamping large z value: ${planeIntersection.z} to max distance: ${maxDistance}`);
          planeIntersection.z = Math.sign(planeIntersection.z) * maxDistance;
        }

        return planeIntersection;
      }
    }

    if (isDevelopment) console.log('Failed to find intersection point');

    // Final fallback method - Project at fixed distance from camera
    const cameraDirection = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const distanceFromCamera = 10; // Fixed distance from camera
    const fixedPoint = new Vector3().copy(camera.position).add(cameraDirection.multiplyScalar(distanceFromCamera));

    if (isDevelopment) console.log('Emergency fallback: Fixed distance from camera:', fixedPoint);
    return fixedPoint;
  }, [camera, scene, getMouseInputs, size]);

  // Move command execution function
  // Moves character to clicked position and displays visual effect
  const moveToPosition = useCallback(
    (position: Vector3) => {
      // Don't move if movement is not allowed
      if (!canMove) {
        if (isDevelopment) console.log('Movement currently disabled');
        return;
      }

      if (isDevelopment) console.log('Moving to position:', position);

      // Set movement point in game state (triggers character movement)
      setMoveToPoint(position);

      // Set position for click effect visualization (slightly above floor)
      setClickPosition(new Vector3(position.x, position.y + 0.01, position.z));
      // Reset effect size
      setEffectScale(1);
      // Activate click effect
      setClickEffect(true);

      // Block movement briefly to prevent continuous clicks
      setCanMove(false);
      setTimeout(() => {
        setCanMove(true);
      }, 100);
    },
    [canMove, setMoveToPoint],
  );

  // Frame counter (for reducing log frequency)
  const frameCounter = useRef(0);

  // Click effect animation and mouse input handling
  useFrame(() => {
    frameCounter.current += 1;

    // Log every 60 frames to prevent console spam
    const shouldLog = isDevelopment && frameCounter.current % 60 === 0;

    // Process click effect animation
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // Shrink slowly
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

    // Handle right click press (track start time)
    if (rightJustPressed) {
      clickTimeRef.current = Date.now();
      if (isDevelopment) console.log('Right click pressed');
    }

    // Handle right click release (check if it was a quick click)
    if (rightJustReleased) {
      const clickDuration = Date.now() - clickTimeRef.current;
      if (isDevelopment) console.log('Right click released, duration:', clickDuration, 'ms');

      if (clickDuration < 200) {
        if (isDevelopment) console.log('Processing quick click');
        // Get world position from mouse coordinates
        const point = getWorldPositionFromMouse();

        if (point) {
          // Process through the move function
          moveToPosition(point);
        }
      }
    }
  });

  // Clean up animation when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
        position={[0, 0.01, 0]} // Slightly above floor
        visible={isDevelopment} // Only visible in development mode
        userData={{ isFloor: true, isTargetingFloor: true }}
        name="targeting-floor"
      >
        <planeGeometry args={[1000, 1000]} /> {/* Larger plane for better raycasting */}
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.1} />
      </mesh>
    </>
  );
};

export default PointingSystem;
