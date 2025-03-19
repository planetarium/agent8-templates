import React, {useCallback, useEffect, useRef, useState} from "react";
import {Canvas} from "@react-three/fiber";
import {Vector3} from "three";
import {CharacterAction} from "../constants/character.constant";
import {CharacterResource} from "../types/characterResource";
import {World} from "./world/World.tsx";

interface GameSceneProps {
  characterResource: CharacterResource;
}

export const GameScene: React.FC<GameSceneProps> = ({ characterResource }) => {
  const [position, setPosition] = useState(new Vector3(0, 0, 0));
  const [currentAction, setCurrentAction] = useState<CharacterAction>(
    CharacterAction.IDLE
  );
  const currentActionRef = useRef<CharacterAction>(CharacterAction.IDLE);

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  const handleAnimationComplete = useCallback((action: CharacterAction) => {
    console.log(`Animation ${action} completed`);

    switch (action) {
      case CharacterAction.JUMP_UP:
        setCurrentAction(CharacterAction.FALL_IDLE);
        break;
      case CharacterAction.FALL_DOWN:
        setCurrentAction(CharacterAction.IDLE);
        break;
      default:
        break;
    }
  }, []);

  const handlePositionUpdate = useCallback((newPosition: Vector3) => {
    setPosition(newPosition);
  }, []);

  const handleActionUpdate = useCallback((newAction: CharacterAction) => {
    setCurrentAction(newAction);
  }, []);

  return (
    <>
      <Canvas shadows>
        <World
          characterResource={characterResource}
          position={position}
          currentAction={currentAction}
          currentActionRef={currentActionRef}
          onAnimationComplete={handleAnimationComplete}
          onPositionUpdate={handlePositionUpdate}
          onActionUpdate={handleActionUpdate}
        />
      </Canvas>
    </>
  );
};
