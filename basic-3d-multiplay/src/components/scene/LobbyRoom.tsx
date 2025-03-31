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
  const roomState = useRoomState();
  const userStates = useRoomAllUserStates() as UserState[];
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null
  );

  // Get available characters from assets
  const availableCharacters = Object.keys(Assets.characters);

  // Get current user's state
  const currentUserState = userStates.find(
    (user) => user.account === server.account
  );

  // Toggle ready status
  const handleToggleReady = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await server.remoteFunction("toggleReady", []);
      setIsReady(!isReady);
    } catch (err) {
      setError(
        `Failed to change ready status: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle character selection
  const handleCharacterSelect = async (character: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await server.remoteFunction("setCharacter", [character]);
      setSelectedCharacter(character);
    } catch (err) {
      setError(
        `Failed to select character: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  // Update local ready state when server state changes
  useEffect(() => {
    if (currentUserState?.isReady !== undefined) {
      setIsReady(currentUserState.isReady);
    }

    // Update selected character from server state
    if (currentUserState?.character) {
      setSelectedCharacter(currentUserState.character);
    }
  }, [currentUserState]);

  // Handle countdown timer
  useEffect(() => {
    if (roomState?.countdownStarted && roomState.countdownEndTime) {
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.ceil((roomState.countdownEndTime - now) / 1000)
        );
        setCountdown(remaining);
      };

      // Update immediately and then every 100ms
      updateCountdown();
      const interval = setInterval(updateCountdown, 100);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [roomState?.countdownStarted, roomState?.countdownEndTime]);

  // Get character name for display
  const getCharacterDisplayName = (characterKey: string) => {
    return characterKey.replace(".vrm", "");
  };

  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
        <div className="flex justify-between items-center py-2 mb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-medium">Room: {roomId}</h2>
            <button
              onClick={copyRoomId}
              className="text-blue-600 text-sm bg-transparent border-none p-0"
            >
              Copy ID
            </button>
          </div>
          <button
            onClick={onLeaveRoom}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Leave
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Player Info & Character Selection */}
            <div className="space-y-4">
              {/* Player Info */}
              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium">My Info</h3>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>{currentUserState?.nickname || "Not set"}</div>
                  <button
                    onClick={handleToggleReady}
                    disabled={isLoading || !selectedCharacter}
                    className={`px-3 py-1 rounded text-xs text-white ${
                      isReady ? "bg-green-600" : "bg-blue-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isReady ? "Ready" : "Get Ready"}
                  </button>
                </div>
                {error && (
                  <div className="mx-3 mb-3 p-2 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                    {error}
                  </div>
                )}
              </div>

              {/* Character Selection */}
              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-medium">Select Character</h3>
                  {selectedCharacter && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <span className="font-medium">
                        {getCharacterDisplayName(selectedCharacter)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div
                    className={`h-40 overflow-y-auto border border-gray-200 rounded ${
                      isLoading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <ul className="divide-y divide-gray-200">
                      {availableCharacters.map((character) => (
                        <li
                          key={character}
                          className={`px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50 ${
                            selectedCharacter === character
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : ""
                          }`}
                          onClick={() => handleCharacterSelect(character)}
                        >
                          <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                          <span className="text-sm truncate">
                            {getCharacterDisplayName(character)}
                          </span>
                          {selectedCharacter === character && (
                            <svg
                              className="w-4 h-4 ml-auto text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
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
              </div>
            </div>

            {/* Right Column - Participants */}
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-medium">
                  Participants ({userStates.length})
                </h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {userStates.length === 0 ? (
                  <p className="p-3 text-center text-gray-500 text-sm">
                    No participants
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {userStates.map((user) => (
                      <li
                        key={user.account}
                        className={`px-3 py-2 flex justify-between items-center text-sm ${
                          user.account === server.account ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {user.nickname ||
                              user.account.substring(0, 8) + "..."}
                          </span>
                          {user.account === server.account && (
                            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              Me
                            </span>
                          )}
                          {user.character && (
                            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {getCharacterDisplayName(user.character)}
                            </span>
                          )}
                        </div>
                        <div
                          className={
                            user.isReady ? "text-green-600" : "text-gray-500"
                          }
                        >
                          {user.isReady ? "Ready" : "Not Ready"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {roomState?.allReady && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center text-green-800 text-sm">
              <div>All participants are ready! Game starting...</div>
              {countdown !== null && (
                <div className="font-bold mt-1">
                  Game starts in {countdown} seconds
                </div>
              )}
              {countdown !== null && (
                <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-100"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyRoom;
