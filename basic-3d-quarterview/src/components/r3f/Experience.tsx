import { Environment } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import Player from './Player';
import Floor from './Floor';
import { QuarterViewController, FollowLight } from 'vibe-starter-3d';

const Experience = () => {
  return (
    <>
      <ambientLight intensity={0.7} />

      <FollowLight offset={[60, 100, 30]} intensity={2} />

      <Environment preset="sunset" background={false} />

      {/* Player character with Controller */}
      <QuarterViewController followCharacter={true}>
        <Player initState={CharacterState.IDLE} />
      </QuarterViewController>

      {/* Floor */}
      <Floor />
    </>
  );
};

export default Experience;
