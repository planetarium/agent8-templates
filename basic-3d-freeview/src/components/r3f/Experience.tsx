import { Environment, Grid } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { FreeViewController } from 'vibe-starter-3d';
import Floor from './Floor';
import Player from './Player';

const targetHeight = 1.6;

function Experience() {
  return (
    <>
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <FreeViewController targetHeight={targetHeight}>
        <Player initState={CharacterState.IDLE} targetHeight={targetHeight} />
      </FreeViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}

export default Experience;
