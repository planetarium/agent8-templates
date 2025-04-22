import { useState, useEffect, useRef } from 'react';
import { useGameServer } from '@agent8/gameserver';
import './App.css';
import NicknameSetup from './components/scene/NicknameSetup';
import RoomManager from './components/scene/RoomManager';
import LobbyRoom from './components/scene/LobbyRoom';
import { GameScene } from './components/scene/GameScene';
import { networkSyncStore } from './store/networkSyncStore';

function App() {
  const { connected, server } = useGameServer();
  const [nickname, setNickname] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [roomStarted, setRoomStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for async operations
  const [error, setError] = useState<string | null>(null); // Error message state

  useEffect(() => {
    console.log('server', server.account);
    if (server && connected) {
      networkSyncStore.getState().setServer(server);
    }
    return () => {
      networkSyncStore.getState().setServer(null);
    };
  }, [server, connected]);

  useEffect(() => {
    if (!server || !connected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomState(currentRoomId, (roomState) => {
      setRoomStarted(roomState.gameStarted);
    });

    return () => {
      unsubscribe();
    };
  }, [server, connected, currentRoomId]);

  useEffect(() => {
    if (!server || !connected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomMyState(currentRoomId, (roomMyState) => {
      console.log('roomMyState', roomMyState);
      setIsReady(roomMyState.isReady ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, [server, connected, currentRoomId]);

  // Handles setting the user's nickname
  const handleNicknameSet = (newNickname: string) => {
    setNickname(newNickname);
    setError(null); // Clear previous errors
  };

  // Resets the state to go back to the nickname setup screen
  const handleBackToNickname = () => {
    setNickname(null);
    setError(null);
  };

  // Handles joining a room (or creating one if roomId is undefined)
  const handleJoinRoom = async (roomId?: string) => {
    if (!connected) {
      setError('Server connection not established');
      return;
    }

    if (!nickname) {
      setError('Please set a nickname first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the remote function to join/create a room
      const joinedRoomId = await server.remoteFunction('joinRoom', [roomId, nickname]);
      setCurrentRoomId(joinedRoomId);
    } catch (err) {
      setError(`Failed to join room: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles leaving the current room
  const handleLeaveRoom = async () => {
    if (!connected || !currentRoomId) return; // Do nothing if not connected or not in a room

    setIsLoading(true);

    try {
      // Call the remote function to leave the room
      await server.remoteFunction('leaveRoom', []);
      setCurrentRoomId(null); // Clear the current room ID
    } catch (err) {
      setError(`Failed to leave room: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determines which component/scene to render based on the current state
  const renderContent = () => {
    // Show loading indicator if not connected to the server yet
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

    // Show nickname setup if nickname is not set
    if (!nickname) {
      return <NicknameSetup onNicknameSet={handleNicknameSet} isLoading={isLoading} error={error} />;
    }

    // Show room manager (create/join) if not currently in a room
    if (!currentRoomId) {
      return <RoomManager onJoinRoom={handleJoinRoom} onBack={handleBackToNickname} nickname={nickname} isLoading={isLoading} error={error} />;
    }

    console.log('roomStarted', roomStarted, isReady);

    // Show game scene if the game has started and the user is ready
    // Note: Character selection check might be needed here or handled within GameScene/LobbyRoom
    if (roomStarted && isReady) {
      return <GameScene roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} />;
    }

    // Otherwise, show the lobby room
    if (currentRoomId && !isReady) {
      return <LobbyRoom roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} server={server} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Render the determined content */}
      <div>{renderContent()}</div>
    </div>
  );
}

export default App;
