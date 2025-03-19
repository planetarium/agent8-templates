import React from "react";
import { Vector3 } from "three";
import { CharacterAction } from "../../constants/character.constant";

interface PositionInfoUIProps {
  position: Vector3;
  currentAction: CharacterAction;
}

export const PositionInfoUI: React.FC<PositionInfoUIProps> = ({
  position,
  currentAction,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.8)",
        padding: "12px",
        borderRadius: "8px",
        color: "white",
        fontSize: "14px",
        fontFamily: "monospace",
        whiteSpace: "pre",
        zIndex: 1000,
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "4px", color: "#4CAF50" }}>
        Character Position
      </div>
      <div>{`X: ${position.x.toFixed(2)} (${
        position.x > 0 ? "East" : "West"
      })`}</div>
      <div>{`Z: ${position.z.toFixed(2)} (${
        position.z > 0 ? "South" : "North"
      })`}</div>
      <div style={{ marginTop: "4px", color: "#2196F3" }}>
        {`Current Action: ${currentAction}`}
      </div>
    </div>
  );
};
