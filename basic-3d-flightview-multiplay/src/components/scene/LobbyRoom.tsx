import { useState, useEffect } from 'react';
import { useRoomAllUserStates, GameServer } from '@agent8/gameserver';
import { UserState } from '../../types';

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
  console.log('LobbyRoom', roomId);

  const userStates = useRoomAllUserStates() as UserState[];
  const [isStarted, setIsStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserState = userStates.find((user) => user.account === server.account);

  useEffect(() => {
    setIsStarted(true);
  }, []);

  const handleToggleReady = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await server.remoteFunction('toggleReady', []);
      console.log('result', result);
      setIsReady(!isReady);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserState) {
      setIsReady(currentUserState.isReady ?? false);
    } else {
      setIsReady(false);
    }
  }, [currentUserState]);

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
                  disabled={isLoading || !isStarted}
                  className={`px-4 py-1.5 text-sm font-medium rounded shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed ${
                    isReady ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
                  }`}
                >
                  {isReady ? 'Ready' : 'Set Ready'}
                </button>
              </div>
              {error && <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 border border-red-200 rounded">Error: {error}</div>}
            </div>
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
