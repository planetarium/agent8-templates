import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { STAGE } from '../config';
import { cellAt, cellCenter, type Cell } from '../game/grid';

/** A click that moved more than this many pixels was a camera drag, not a pick. */
const CLICK_SLOP = 4;

function Lights() {
  return (
    <>
      <hemisphereLight args={['#dceeff', '#6b5a43', 0.9]} />
      <directionalLight
        position={[12, 20, 8]}
        castShadow
        intensity={2.2}
        color="#fff3dc"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

/** Ground, sky, sun and a marker cube on the origin cell. Click a grid cell to move the marker there. */
export function Stage() {
  const [marker, setMarker] = useState<Cell>({ i: 0, j: 0 });
  const at = cellCenter(STAGE.grid, marker);
  const gridSize = STAGE.grid.cell * STAGE.grid.cells;

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_SLOP) return;
    const c = cellAt(STAGE.grid, e.point.x, e.point.z);
    if (c) setMarker(c);
  };

  return (
    <>
      <Sky sunPosition={[100, 40, 80]} turbidity={4} rayleigh={1.2} />
      <fog attach="fog" args={['#cfe3f5', 40, 120]} />
      <Lights />
      {/* ground: top face at y = 0, same footprint as the floor collider in physics/PhysicsDemo.tsx */}
      <mesh position={[0, -0.5, 0]} receiveShadow onClick={pick}>
        <boxGeometry args={[STAGE.size, 1, STAGE.size]} />
        <meshStandardMaterial color="#7fb069" />
      </mesh>
      <gridHelper args={[gridSize, STAGE.grid.cells, '#3d5a32', '#5e8a4e']} position={[0, 0.01, 0]} />
      {/* marker cube */}
      <mesh position={[at.x, 0.5, at.z]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e6aa68" />
      </mesh>
    </>
  );
}
