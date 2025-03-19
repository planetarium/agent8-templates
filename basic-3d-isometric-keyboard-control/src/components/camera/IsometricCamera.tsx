import { useFrame, useThree } from "@react-three/fiber";
import { Group, PerspectiveCamera, OrthographicCamera } from "three";
import { useEffect } from "react";

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
    Y: 0, // or -Math.PI / 4,
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
  target: React.RefObject<Group>;
  mode?: CameraMode;
}

const IsometricCamera = ({
  target,
  mode = "perspective",
}: IsometricCameraProps) => {
  const { camera, set } = useThree();

  // Camera initialization
  useEffect(() => {
    let newCamera;
    const aspect = window.innerWidth / window.innerHeight;

    if (mode === "perspective") {
      newCamera = new PerspectiveCamera(
        ISOMETRIC.PERSPECTIVE.FOV,
        aspect,
        ISOMETRIC.PERSPECTIVE.NEAR,
        ISOMETRIC.PERSPECTIVE.FAR
      );
    } else {
      const frustumSize = ISOMETRIC.ORTHOGRAPHIC.VIEW_SIZE;
      newCamera = new OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        ISOMETRIC.ORTHOGRAPHIC.NEAR,
        ISOMETRIC.ORTHOGRAPHIC.FAR
      );
    }

    // Replace camera in Three.js scene
    set({ camera: newCamera });

    // Handle window resize events
    const handleResize = () => {
      const newAspect = window.innerWidth / window.innerHeight;

      if (mode === "perspective") {
        newCamera.aspect = newAspect;
      } else {
        const frustumSize = ISOMETRIC.ORTHOGRAPHIC.VIEW_SIZE;
        (newCamera as OrthographicCamera).left = (frustumSize * newAspect) / -2;
        (newCamera as OrthographicCamera).right = (frustumSize * newAspect) / 2;
        (newCamera as OrthographicCamera).top = frustumSize / 2;
        (newCamera as OrthographicCamera).bottom = frustumSize / -2;
      }
      newCamera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mode, set]);

  useFrame(() => {
    if (!target.current) return;

    // Set camera position to character position
    camera.position.copy(target.current.position);

    // Set rotation order (Y-axis rotation followed by X-axis rotation)
    camera.rotation.order = "YXZ";

    // Set camera rotation to precise isometric angles
    camera.rotation.y = ISOMETRIC.ROTATION.Y; // Y-axis 0 or -45 degree rotation
    camera.rotation.x = -ISOMETRIC.ROTATION.X; // X-axis -35.264 degree rotation (looking down)
    camera.rotation.z = 0;

    // Move camera back after rotation
    camera.translateZ(ISOMETRIC.DISTANCE);
  });

  return null;
};

export default IsometricCamera;
