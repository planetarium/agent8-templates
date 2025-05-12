import { useState, useEffect } from 'react';
import { useRoomAllUserStates, GameServer } from '@agent8/gameserver';
import Assets from '../../assets.json';
import { UserState } from '../../types';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import CharacterPreview from '../r3f/CharacterPreview';

/**
 * Lobby room props
 */
interface LobbyRoomProps {
  /** Current room ID */
  roomId: string;
  /** Handler for leaving room */
  onLeaveRoom: () => Promise<void>;
  /** Game server instance */
  server: GameServer;
}

const LobbyRoom: React.FC<LobbyRoomProps> = ({ roomId, onLeaveRoom, server }) => {
  const userStates = useRoomAllUserStates() as UserState[];
  const [isStarted, setIsStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const availableCharacters = Object.keys(Assets.characters);
  const currentUserState = userStates.find((user) => user.account === server.account);

  useEffect(() => {
    setIsStarted(true);
  }, []);

  const handleToggleReady = async () => {
    if (isLoading || !selectedCharacter) return;
    setIsLoading(true);
    setError(null);
    try {
      await server.remoteFunction('toggleReady', []);
      setIsReady(!isReady);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterSelect = async (character: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await server.remoteFunction('setCharacter', [character]);
      setSelectedCharacter(character);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserState && selectedCharacter) {
      setIsReady(currentUserState.isReady ?? false);
      setSelectedCharacter(currentUserState.character || null);
    } else {
      setIsReady(false);
      setSelectedCharacter(null);
    }
  }, [currentUserState, selectedCharacter]);

  return (
    <div className="relative w-full h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center bg-white shadow-md">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100" onClick={onLeaveRoom}>
          Leave Room
        </button>
        <div className="px-3 py-1 bg-gray-100 rounded border border-gray-200 text-sm">
          Room ID: <span className="font-semibold">{roomId}</span>
          <button onClick={() => navigator.clipboard.writeText(roomId)} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium">
            Copy
          </button>
        </div>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-4 relative">
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-lg">{currentUserState?.nickname || 'Player'}</div>
                <button
                  onClick={handleToggleReady}
                  disabled={isLoading || !selectedCharacter || !isStarted}
                  className={`px-4 py-1.5 text-sm font-medium rounded shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed ${
                    isReady ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
                  }`}
                >
                  {isReady ? 'Ready' : 'Set Ready'}
                </button>
              </div>
              {error && <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 border border-red-200 rounded">Error: {error}</div>}

              <label className="block text-sm font-medium text-gray-700 mb-2">Select Character:</label>
              <div className="overflow-y-auto border border-gray-300 rounded bg-white" style={{ maxHeight: '180px' }}>
                <ul className="divide-y divide-gray-200">
                  {availableCharacters.map((character) => (
                    <li
                      key={character}
                      className={`px-3 py-2 flex items-center cursor-pointer hover:bg-gray-100 ${
                        isStarted && selectedCharacter === character ? 'bg-blue-50 font-semibold' : ''
                      }`}
                      onClick={() => handleCharacterSelect(character)}
                    >
                      <span className="text-sm">{character.replace('.vrm', '')}</span>
                      {selectedCharacter === character && (
                        <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedCharacter && (
              <div className="absolute bottom-0 right-0 w-48 aspect-square z-10 p-1 shadow-lg rounded-md">
                <div className="w-full h-full rounded-md overflow-hidden bg-gray-200">
                  <Canvas shadows camera={{ position: [0, 0.8, 1.6], fov: 45 }}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[3, 3, 3]} intensity={2} castShadow />
                    <Suspense fallback={null}>
                      <CharacterPreview characterUrl={Assets.characters[selectedCharacter]?.url || Assets.characters['avatarsample_d_darkness.vrm'].url} />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} target={[0, 0.65, 0]} />
                  </Canvas>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-base font-medium mb-2 text-gray-800">Participants ({userStates.length})</h3>
            <div className="overflow-y-auto border border-gray-300 rounded bg-white" style={{ maxHeight: 'calc(200px + 4rem)' }}>
              {userStates.length === 0 ? (
                <p className="p-3 text-center text-sm text-gray-500">No participants yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userStates.map((user) => (
                    <li key={user.account} className="px-3 py-2 flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${user.isReady ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {user.nickname || user.account.substring(0, 8) + '...'}
                        {user.account === server.account && <span className="ml-1.5 text-xs font-medium text-blue-700">(You)</span>}
                      </span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${user.isReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {user.isReady ? 'Ready' : 'Waiting'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyRoom;
