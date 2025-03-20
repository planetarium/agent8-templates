import { useFrame, useThree } from "@react-three/fiber";
import { Group, PerspectiveCamera, OrthographicCamera, Vector3 } from "three";
import { useEffect, useRef } from "react";
import { RapierRigidBody } from "@react-three/rapier";

type CameraMode = "perspective" | "orthographic";

// Constants for isometric view
const ISOMETRIC = {
  // Distance between camera and character
  DISTANCE: 15, // Adjusted for closer view
  // Precise isometric angles
  ROTATION: {
    // X-axis rotation angle (arctan(1/√2) ≈ 35.264 degrees)
    X: Math.atan(1 / Math.sqrt(2)),
    // Y-axis rotation angle (-45 degrees)
    Y: 0,
  },
  // Perspective camera settings
  PERSPECTIVE: {
    FOV: 35, // Adjusted for narrower FOV
    NEAR: 0.1,
    FAR: 1000,
  },
  // Orthographic camera settings
  ORTHOGRAPHIC: {
    // View size (adjusted for larger character view)
    VIEW_SIZE: 10,
    NEAR: 0.1,
    FAR: 1000,
  },
} as const;

interface IsometricCameraProps {
  targetRef?: React.RefObject<Group>;
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
  mode?: CameraMode;
}

const IsometricCamera = ({
  targetRef,
  rigidBodyRef,
  mode = "perspective",
}: IsometricCameraProps) => {
  const { camera, set } = useThree();
  const lastValidPosition = useRef(new Vector3());

  // Initialize camera
  useEffect(() => {
    const aspect = window.innerWidth / window.innerHeight;
    const newCamera =
      mode === "perspective"
        ? createPerspectiveCamera(aspect)
        : createOrthographicCamera(aspect);

    set({ camera: newCamera });

    // Handle window resize
    const handleResize = () => {
      const newAspect = window.innerWidth / window.innerHeight;
      updateCameraAspect(newCamera, newAspect, mode);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mode, set]);

  // Follow character position each frame
  useFrame(() => {
    const position = getCharacterPosition();
    updateCameraPosition(position);
  });

  // Get character position from available refs
  const getCharacterPosition = () => {
    let position;
    let hasValidPosition = false;

    // Try getting position from direct rigidBodyRef
    if (rigidBodyRef?.current) {
      position = getPositionFromRigidBody(rigidBodyRef.current);
      hasValidPosition = true;
    }
    // If no valid position from rigidBody, try target group
    else if (targetRef?.current) {
      position = targetRef.current.position.clone();
      hasValidPosition = true;
    }

    // Use last valid position if no valid position found
    if (!hasValidPosition) {
      return lastValidPosition.current;
    }

    // Store valid position for future use
    lastValidPosition.current.copy(position);
    return position;
  };

  // Get position from rigid body
  const getPositionFromRigidBody = (body: RapierRigidBody) => {
    const translation = body.translation();
    return new Vector3(translation.x, translation.y, translation.z);
  };

  // Update camera position and rotation
  const updateCameraPosition = (position: Vector3) => {
    camera.position.copy(position);
    camera.rotation.order = "YXZ";
    camera.rotation.y = ISOMETRIC.ROTATION.Y;
    camera.rotation.x = -ISOMETRIC.ROTATION.X;
    camera.rotation.z = 0;
    camera.translateZ(ISOMETRIC.DISTANCE);
  };

  // Create perspective camera
  const createPerspectiveCamera = (aspect: number) => {
    return new PerspectiveCamera(
      ISOMETRIC.PERSPECTIVE.FOV,
      aspect,
      ISOMETRIC.PERSPECTIVE.NEAR,
      ISOMETRIC.PERSPECTIVE.FAR
    );
  };

  // Create orthographic camera
  const createOrthographicCamera = (aspect: number) => {
    const frustumSize = ISOMETRIC.ORTHOGRAPHIC.VIEW_SIZE;
    return new OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      ISOMETRIC.ORTHOGRAPHIC.NEAR,
      ISOMETRIC.ORTHOGRAPHIC.FAR
    );
  };

  // Update camera aspect ratio
  const updateCameraAspect = (
    camera: PerspectiveCamera | OrthographicCamera,
    aspect: number,
    mode: CameraMode
  ) => {
    if (mode === "perspective") {
      (camera as PerspectiveCamera).aspect = aspect;
    } else {
      const frustumSize = ISOMETRIC.ORTHOGRAPHIC.VIEW_SIZE;
      (camera as OrthographicCamera).left = (frustumSize * aspect) / -2;
      (camera as OrthographicCamera).right = (frustumSize * aspect) / 2;
      (camera as OrthographicCamera).top = frustumSize / 2;
      (camera as OrthographicCamera).bottom = frustumSize / -2;
    }
    camera.updateProjectionMatrix();
  };

  return null;
};

export default IsometricCamera;
