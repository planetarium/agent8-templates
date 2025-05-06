import { Environment, Grid } from '@react-three/drei';
import { Player } from './Player';
import { CharacterState } from '../../constants/character';
import { Floor } from './Floor';
import { FreeViewController } from 'vibe-starter-3d';

const targetHeight = 1.6;

/**
 * Experience component props
 */
interface ExperienceProps {
  /** Current player's character key */
  characterUrl: string;
}

/**
 * Main Experience component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements for the local player.
 */
export function Experience({ characterUrl }: ExperienceProps) {
  return (
    <>
      <ambientLight intensity={0.7} />

      {/* Environment */}
      <Environment preset="sunset" background={false} />

      {/* Local player character with controller */}
      <FreeViewController targetHeight={targetHeight}>
        <Player initialState={CharacterState.IDLE} characterKey={characterUrl} />
      </FreeViewController>

      {/* Floor */}
      <Floor />
    </>
  );
}
