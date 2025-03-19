import React, { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Grid, useKeyboardControls } from "@react-three/drei";
import { Vector3, Group } from "three";
import { CharacterAction } from "../../constants/character.constant";
import { CharacterResource } from "../../types/characterResource";
import { Character } from "../character/Character";
import IsometricCamera from "../camera/IsometricCamera";

interface GameWorldProps {
  characterResource: CharacterResource;
  position: Vector3;
  currentAction: CharacterAction;
  currentActionRef: React.RefObject<CharacterAction>;
  onAnimationComplete: (action: CharacterAction) => void;
  onPositionUpdate: (position: Vector3) => void;
  onActionUpdate: (action: CharacterAction) => void;
}

export const World: React.FC<GameWorldProps> = ({
  characterResource,
  position,
  currentAction,
  currentActionRef,
  onAnimationComplete,
  onPositionUpdate,
  onActionUpdate,
}) => {
  const characterGroupRef = useRef<Group>(null);
  const [, get] = useKeyboardControls();
  const direction = useRef(new Vector3());

  const calculateDirection = useCallback((): Vector3 => {
    const { up, down, left, right } = get();
    direction.current.set(0, 0, 0);

    if (up) {
      direction.current.z -= 1;
    }
    if (down) {
      direction.current.z += 1;
    }
    if (right) {
      direction.current.x += 1;
    }
    if (left) {
      direction.current.x -= 1;
    }

    if (direction.current.length() > 0) {
      direction.current.normalize();
    }

    return direction.current;
  }, [get]);

  useFrame((_, delta) => {
    const direction = calculateDirection();
    const baseSpeed = 5;
    const speed = baseSpeed * delta;
    const isMoving = direction.length() > 0;

    if (isMoving) {
      const newPosition = position.clone().add(direction.multiplyScalar(speed));
      onPositionUpdate(newPosition);
    }

    const newAction = isMoving ? CharacterAction.WALK : CharacterAction.IDLE;
    if (newAction !== currentAction) {
      onActionUpdate(newAction);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Environment preset="sunset" background={false} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3f3f3f" />
      </mesh>

      <Grid
        args={[100, 100]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9f9f9f"
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
      />

      <group ref={characterGroupRef} position={[position.x, 0, position.z]}>
        <group
          rotation={[
            0,
            Math.atan2(direction.current.x, direction.current.z),
            0,
          ]}
        >
          <Character
            characterResource={characterResource}
            currentActionRef={currentActionRef}
            onAnimationComplete={onAnimationComplete}
          />
        </group>
      </group>

      <IsometricCamera target={characterGroupRef} />
    </>
  );
};
