import React, { useEffect, useRef } from "react";
import { createGame } from "../game/Game";

const GameComponent: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameContainerRef.current && !gameInstanceRef.current) {
      gameInstanceRef.current = createGame(gameContainerRef.current.id);
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="phaser-game"
      ref={gameContainerRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
};

export default GameComponent;
