import React from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { World } from "./world/World.tsx";

export const GameScene: React.FC = () => {
  return (
    <>
      <Canvas shadows>
        <Physics debug={true} gravity={[0, -9.81, 0]}>
          <World />
        </Physics>
      </Canvas>
    </>
  );
};
