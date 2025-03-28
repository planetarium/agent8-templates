import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Character } from "./character/Character";
import { Environment, OrbitControls } from "@react-three/drei";
import { CharacterAction } from "../constants/character";
import { CharacterResource } from "vibe-starter-3d";
import Assets from "../assets.json";
/**
 * Simple 3D character preview scene
 */
const PreviewScene: React.FC = () => {
  const [currentAction, setCurrentAction] = useState<CharacterAction>(
    CharacterAction.IDLE
  );
  const currentActionRef = useRef<CharacterAction>(CharacterAction.IDLE);

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  // Handle animation completion
  const onAnimationComplete = useCallback((action: CharacterAction) => {
    console.log(`Animation ${action} completed`);

    // Transition to appropriate next state after animation completion
    switch (action) {
      case CharacterAction.HIT:
        // Transition to IDLE after HIT animation completes
        console.log("Transitioning from HIT to IDLE");
        setCurrentAction(CharacterAction.IDLE);
        break;

      default:
        // Do nothing by default
        break;
    }
  }, []);

  const characterResource: CharacterResource = useMemo(
    () => ({
      name: "Default Character",
      url: Assets.characters["space-marine"].url,
      animations: {
        IDLE: Assets.animations.idle.url,
        WALK: Assets.animations.walk.url,
        RUN: Assets.animations.run.url,
        JUMP: Assets.animations.jump.url,
        PUNCH: Assets.animations.punch.url,
        MELEE_ATTACK: Assets.animations.melee_attack.url,
        AIM: Assets.animations.aim.url,
        SHOOT: Assets.animations.shoot.url,
        AIM_RUN: Assets.animations.aim_run.url,
        HIT: Assets.animations.hit.url,
        DIE: Assets.animations.die.url,
      },
    }),
    []
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          width: "800px",
          height: "450px",
          backgroundColor: "#2b2b2b",
          marginBottom: "20px",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} shadows>
          {/* Simple ambient light for base illumination */}
          <ambientLight intensity={0.7} />

          {/* Main directional light with shadows */}
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Environment map for nice reflections */}
          <Environment preset="sunset" background={false} />

          {/* Character group */}
          <group scale={2} position={[0, -1.75, 0]}>
            <Character
              characterResource={characterResource}
              currentActionRef={currentActionRef}
              onAnimationComplete={onAnimationComplete}
            />
          </group>

          {/* Simple camera controls */}
          <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
        </Canvas>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {Object.values(CharacterAction)
          .filter((action) => typeof action === "string")
          .map((action) => (
            <button
              key={action}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  currentAction === action ? "#2980b9" : "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                setCurrentAction(action as CharacterAction);
              }}
            >
              {action}
            </button>
          ))}
      </div>
    </div>
  );
};

export default PreviewScene;
