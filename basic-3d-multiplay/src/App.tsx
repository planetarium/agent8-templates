import { useState, useEffect } from "react";
import { useGameServer } from "@agent8/gameserver";
import "./App.css";
import NicknameSetup from "./components/scene/NicknameSetup";
import RoomManager from "./components/scene/RoomManager";
import LobbyRoom from "./components/scene/LobbyRoom";
import { GameScene } from "./components/scene/GameScene";

function App() {
  const { connected, server } = useGameServer();
  const [nickname, setNickname] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isUserReady, setIsUserReady] = useState(false);
  const [hasSelectedCharacter, setHasSelectedCharacter] = useState(false);

  // Handle nickname setting
  const handleNicknameSet = (newNickname: string) => {
    setNickname(newNickname);
    setError(null);
  };

  // Reset to nickname setup screen
  const handleBackToNickname = () => {
    setNickname(null);
    setError(null);
  };

  // Handle room joining
  const handleJoinRoom = async (roomId?: string) => {
    if (!connected) {
      setError("Server connection not established");
      return;
    }

    if (!nickname) {
      setError("Please set a nickname first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const joinedRoomId = await server.remoteFunction("joinRoom", [
        roomId,
        nickname,
      ]);
      setCurrentRoomId(joinedRoomId);
      setGameStarted(false); // Reset game state when joining a new room
      setIsUserReady(false); // Reset ready status
      setHasSelectedCharacter(false); // Reset character selection
    } catch (err) {
      setError(
        `Failed to join room: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle leaving a room
  const handleLeaveRoom = async () => {
    if (!connected || !currentRoomId) return;

    setIsLoading(true);

    try {
      await server.remoteFunction("leaveRoom", []);
      setCurrentRoomId(null);
      setGameStarted(false);
      setIsUserReady(false);
      setHasSelectedCharacter(false);
    } catch (err) {
      setError(
        `Failed to leave room: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to room state to detect when all users are ready
  useEffect(() => {
    if (!connected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomState(currentRoomId, (state) => {
      if (state?.gameStarted) {
        setGameStarted(true);
      }
    });

    return () => unsubscribe();
  }, [connected, currentRoomId, server]);

  // Subscribe to user state to check ready status and character selection
  useEffect(() => {
    if (!connected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomUserState(
      currentRoomId,
      server.account,
      (userState) => {
        if (userState) {
          setIsUserReady(userState.isReady);
          setHasSelectedCharacter(!!userState.character);
        }
      }
    );

    return () => unsubscribe();
  }, [connected, currentRoomId, server]);

  // Determine which screen to show
  const renderContent = () => {
    if (!connected) {
      return (
        <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-white/90 z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p>Connecting to server...</p>
          </div>
        </div>
      );
    }

    if (!nickname) {
      return (
        <NicknameSetup
          onNicknameSet={handleNicknameSet}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    if (!currentRoomId) {
      return (
        <RoomManager
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToNickname}
          nickname={nickname}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    // 게임이 시작되었고, 사용자가 레디 상태이며, 캐릭터도 선택했을 때만 게임 씬으로 전환
    if (gameStarted && isUserReady && hasSelectedCharacter) {
      return (
        <GameScene
          roomId={currentRoomId}
          onLeaveRoom={handleLeaveRoom}
          server={server}
        />
      );
    }

    // 그렇지 않으면 로비에 머무름
    return (
      <LobbyRoom
        roomId={currentRoomId}
        onLeaveRoom={handleLeaveRoom}
        server={server}
      />
    );
  };

  // 게임 씬으로 전환해야 하는지 결정 (상단 리턴 조건 수정)
  if (gameStarted && currentRoomId && isUserReady && hasSelectedCharacter) {
    return renderContent();
  }

  return (
    <div className="min-h-screen">
      <div>{renderContent()}</div>
    </div>
  );
}

export default App;
