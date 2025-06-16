import { Environment } from '@react-three/drei';
import { CharacterState } from '../../constants/character';
import { FirstPersonViewController, FollowLight } from 'vibe-starter-3d';
import Player from './Player';
import Floor from './Floor';

const targetHeight = 1.6;

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

function Experience({ characterUrl }: ExperienceProps) {
  return (
    <>
      <ambientLight intensity={0.7} />

      <FollowLight />

      <Environment preset="sunset" background={false} />

      <Player characterKey={characterUrl} />

      {/* Floor */}
      <Floor />
    </>
  );
}

export default Experience;
