import React, { useMemo } from "react";
import "./App.css";
import { KeyboardControls } from "@react-three/drei";

import { CharacterResource } from "./types/characterResource";
import { keyboardMap } from "./constants/controls.constant.ts";
import { GameScene } from "./components/GameScene.tsx";

const App: React.FC = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <KeyboardControls map={keyboardMap}>
        <GameScene />
      </KeyboardControls>
    </div>
  );
};

export default App;
