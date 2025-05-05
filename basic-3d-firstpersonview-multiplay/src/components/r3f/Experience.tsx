import { Environment, Grid } from '@react-three/drei';
import { Player } from './Player';
import { Floor } from './Floor';
import { CharacterState } from '../../constants/character';
import { FirstPersonViewController } from 'vibe-starter-3d';

const targetHeight = 1.6;

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

export function Experience({ characterUrl }: ExperienceProps) {
  return (
    <>
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* player character with controller */}
      <FirstPersonViewController targetHeight={targetHeight}>
        <Player targetHeight={targetHeight} initialState={CharacterState.IDLE} characterKey={characterUrl} />
      </FirstPersonViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}
