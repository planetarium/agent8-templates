import { Environment } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { SideViewController } from 'vibe-starter-3d';

const Experience = () => {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <SideViewController cameraMode="perspective" followCharacter={true} camDistance={10}>
        <Player initState={CharacterState.IDLE} />
      </SideViewController>

      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
