// MuzzleFlash.tsx (new file)
import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type PrimitiveOrArray = Primitive | Primitive[];

// --- Muzzle Flash Configuration ---
const FLASH_PETAL_COUNT = 5; // Number of flame petals
const FLASH_PETAL_LENGTH = 0.4; // Length of each petal
const FLASH_PETAL_BASE_RADIUS = 0.03; // Base radius of each petal
const FLASH_RADIAL_SEGMENTS = 4; // Number of radial segments for each cone
const FLASH_TILT_ANGLE = Math.PI / 4; // Tilt angle of flame petals (45 degrees)
const FLASH_INNER_GLOW_SIZE = 0.08; // Size of the center glow
const FLASH_COLOR = "#FFA500"; // Orange color
const FLASH_INNER_COLOR = "#FFFF55"; // Brighter yellow for center
const DEFAULT_DURATION = 100; // Default duration
// ------------------------

interface MuzzleFlashProps {
  config: { [key: string]: PrimitiveOrArray };
  onComplete?: () => void;
}

// Utility to convert THREE.Vector3 to array (needed for store/server)
const vecToArray = (vec: THREE.Vector3): [number, number, number] => {
  return [vec.x, vec.y, vec.z];
};

// Utility to convert Vector3 array to THREE.Vector3 (needed for rendering)
const arrayToVec = (arr?: [number, number, number]): THREE.Vector3 => {
  if (!arr) {
    console.error("Missing required config properties");
    return new THREE.Vector3();
  }
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
};

export const createMuzzleFlashConfig = (
  position: THREE.Vector3,
  direction: THREE.Vector3,
  duration: number
): { [key: string]: PrimitiveOrArray } => {
  return {
    position: vecToArray(position),
    direction: vecToArray(direction),
    duration,
  };
};

const parseConfig = (config: { [key: string]: any }) => {
  return {
    position: arrayToVec(config.position as [number, number, number]),
    direction: arrayToVec(config.direction as [number, number, number]),
    duration: (config.duration as number) || DEFAULT_DURATION,
  };
};

export const MuzzleFlash: React.FC<MuzzleFlashProps> = ({
  config,
  onComplete,
}) => {
  const { position, direction, duration } = parseConfig(config);

  const [visible, setVisible] = useState(true);
  const startTime = useMemo(() => Date.now(), []); // Record creation time (for animation)

  // Calculate rotation based on direction
  const flashQuaternion = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    const normalizedDirection = direction.clone().normalize();
    // Rotate the group whose default direction is Z-axis (0,0,1) to the firing direction
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normalizedDirection
    );
    return quaternion;
  }, [direction]);

  // --- Muzzle Flash Related Memos ---
  const petalGeometry = useMemo(
    () =>
      new THREE.ConeGeometry(
        FLASH_PETAL_BASE_RADIUS,
        FLASH_PETAL_LENGTH,
        FLASH_RADIAL_SEGMENTS
      ),
    []
  );
  const petalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: FLASH_COLOR,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    []
  );
  const innerGlowGeometry = useMemo(
    () => new THREE.SphereGeometry(FLASH_INNER_GLOW_SIZE, 16, 8),
    []
  );
  const innerGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: FLASH_INNER_COLOR,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
      }),
    []
  );
  // --- End of Muzzle Flash Related Memos ---

  // Auto-destruction timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]); // Timer reset when id or onComplete function changes

  // Opacity animation
  useFrame(() => {
    if (!visible) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const opacity = 1.0 - progress; // Opacity decreases over time

    petalMaterial.opacity = opacity * 0.8;
    innerGlowMaterial.opacity = opacity;
  });

  if (!position || !direction || !duration) {
    console.error("[MuzzleFlash] Missing required config properties");
    return null;
  }

  if (!visible) return null; // Don't render if not visible

  return (
    <group position={position} quaternion={flashQuaternion}>
      {/* Center glow */}
      <mesh geometry={innerGlowGeometry} material={innerGlowMaterial} />

      {/* Flame petals (using ConeGeometry with tilt applied) */}
      {Array.from({ length: FLASH_PETAL_COUNT }).map((_, i) => {
        const radialAngle = (i / FLASH_PETAL_COUNT) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, 0, radialAngle]}>
            <group rotation={[FLASH_TILT_ANGLE, 0, 0]}>
              <mesh
                geometry={petalGeometry}
                material={petalMaterial}
                position={[0, FLASH_PETAL_LENGTH / 2, 0]}
              />
            </group>
          </group>
        );
      })}
    </group>
  );
};
