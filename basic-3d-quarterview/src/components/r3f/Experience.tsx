import { Environment } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { QuarterViewController } from 'vibe-starter-3d';

const Experience = () => {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* Player character with Controller */}
      <QuarterViewController
        followCharacter={true}
        followLight={{
          position: [0.6, 1, 0.3],
          intensity: 2,
        }}
      >
        <Player initState={CharacterState.IDLE} />
      </QuarterViewController>

      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
