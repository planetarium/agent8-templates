import "./App.css";
import PreviewScene from "./components/PreviewScene";
import { CharacterResource } from "./types/characterResource";
import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

function App() {
  const characterModel: CharacterResource = {
    name: "Default Character",
    url: "https://agent8-games.verse8.io/assets/3d/characters/space-marine.glb",
    animations: {
      IDLE: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/idle.glb",
      WALK: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/walk.glb",
      RUN: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/run.glb",
      JUMP_UP:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/jump-up.glb",
      FALL_IDLE:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/fall-idle.glb",
      FALL_DOWN:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/fall-down.glb",
      PUNCH:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/punch.glb",
      MELEE_ATTACK:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/melee-attack.glb",
      AIM: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/aimming.glb",
      SHOOT:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/shoot.glb",
      AIM_RUN:
        "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/shoot-run.glb",
      HIT: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/hit.glb",
      DIE: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/death.glb",
    },
  };

  // Preload all animation files
  useEffect(() => {
    // Preload character model
    useGLTF.preload(characterModel.url);

    // Preload animation files
    if (characterModel.animations) {
      const animationUrls = Object.values(characterModel.animations);
      console.log("Preloading animation files...", animationUrls.length);
      animationUrls.forEach((url) => {
        useGLTF.preload(url);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PreviewScene characterResource={characterModel} />
    </>
  );
}

export default App;
