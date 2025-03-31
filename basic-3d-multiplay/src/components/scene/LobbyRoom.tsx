import { useState, useEffect } from "react";
import {
  useRoomState,
  useRoomAllUserStates,
  GameServer,
} from "@agent8/gameserver";
import Assets from "../../assets.json";
import { UserState } from "../../types";

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

const LobbyRoom: React.FC<LobbyRoomProps> = ({
  roomId,
  onLeaveRoom,
  server,
}) => {
  const userStates = useRoomAllUserStates() as UserState[];
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null
  );

  const availableCharacters = Object.keys(Assets.characters);
  const currentUserState = userStates.find(
    (user) => user.account === server.account
  );

  const handleToggleReady = async () => {
    if (isLoading || !selectedCharacter) return;
    setIsLoading(true);
    setError(null);
    try {
      await server.remoteFunction("toggleReady", []);
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
      await server.remoteFunction("setCharacter", [character]);
      setSelectedCharacter(character);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserState?.isReady !== undefined) {
      setIsReady(currentUserState.isReady);
    }
    if (currentUserState?.character) {
      setSelectedCharacter(currentUserState.character);
    }
  }, [currentUserState]);

  return (
    <div className="relative w-full">
      <div className="absolute z-10 w-full p-4 flex justify-between pointer-events-none">
        <button
          className="bg-black/50 text-white rounded px-4 py-2 pointer-events-auto"
          onClick={onLeaveRoom}
        >
          Exit
        </button>
        <div className="bg-black/50 text-white rounded px-4 py-2 pointer-events-auto">
          Room ID: {roomId}
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="ml-2 text-blue-200 text-sm"
          >
            복사
          </button>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>{currentUserState?.nickname}</div>
              <button
                onClick={handleToggleReady}
                disabled={isLoading || !selectedCharacter}
                className={`px-2 py-1 rounded text-xs text-white ${
                  isReady ? "bg-green-600" : "bg-blue-600"
                } disabled:opacity-50`}
              >
                {isReady ? "준비완료" : "준비하기"}
              </button>
            </div>
            {error && <div className="text-red-600 text-xs mb-2">{error}</div>}

            <div
              className="border border-gray-200 rounded overflow-y-auto"
              style={{ maxHeight: "180px" }}
            >
              <ul className="divide-y divide-gray-200">
                {availableCharacters.map((character) => (
                  <li
                    key={character}
                    className={`px-2 py-1 flex items-center cursor-pointer hover:bg-gray-50 ${
                      selectedCharacter === character ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <span className="text-xs">
                      {character.replace(".vrm", "")}
                    </span>
                    {selectedCharacter === character && (
                      <svg
                        className="w-3 h-3 ml-auto text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-xs mb-1">참가자 ({userStates.length})</div>
            <div
              className="border border-gray-200 rounded overflow-y-auto"
              style={{ maxHeight: "180px" }}
            >
              {userStates.length === 0 ? (
                <p className="p-2 text-center text-gray-500 text-xs">
                  참가자 없음
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userStates.map((user) => (
                    <li
                      key={user.account}
                      className="px-2 py-1 flex justify-between items-center text-xs"
                    >
                      <span>
                        {user.nickname || user.account.substring(0, 8) + "..."}
                        {user.account === server.account && " (나)"}
                      </span>
                      <span
                        className={
                          user.isReady ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {user.isReady ? "준비" : "대기"}
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
