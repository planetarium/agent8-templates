import { useRef } from 'react';
import * as THREE from 'three';
import { DEFAULT_CONTROLLER_CONFIG } from 'vibe-starter-3d';

const CAMERA_INIT_DISTANCE = 50;

export function Lights() {
  const directionalLightRef = useRef<THREE.DirectionalLight>();

  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1);

  return (
    <>
      <directionalLight
        castShadow
        shadow-normalBias={0.06}
        position={[20, 30, 10]}
        intensity={1.2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={CAMERA_INIT_DISTANCE}
        shadow-camera-top={CAMERA_INIT_DISTANCE}
        shadow-camera-right={CAMERA_INIT_DISTANCE}
        shadow-camera-bottom={-CAMERA_INIT_DISTANCE}
        shadow-camera-left={-CAMERA_INIT_DISTANCE}
        name={DEFAULT_CONTROLLER_CONFIG.MAIN_LIGHT_NAME}
        ref={directionalLightRef}
      />
      <ambientLight intensity={0.7} />
    </>
  );
}
