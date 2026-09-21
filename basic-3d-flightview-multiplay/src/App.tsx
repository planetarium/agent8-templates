import { useState, useEffect } from 'react';
import { useGameServer } from '@agent8/gameserver';
import './App.css';
import { networkSyncStore } from './stores/networkSyncStore';
import NicknameSetup from './components/scene/NicknameSetup';
import RoomManager from './components/scene/RoomManager';
import LobbyRoom from './components/scene/LobbyRoom';
import GameScene from './components/scene/GameScene';

function App() {
  const { connected, server, joinRoom, leaveRoom, currentRoomId, rsConnected } = useGameServer();
  const [nickname, setNickname] = useState<string | null>(null);
  // currentRoomId and rsConnected come from useGameServer(): the SDK owns room membership.
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
    if (!server || !rsConnected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomState(currentRoomId, (roomState) => {
      setRoomStarted(roomState.gameStarted);
    });

    return () => {
      unsubscribe();
    };
  }, [server, rsConnected, currentRoomId]);

  useEffect(() => {
    if (!server || !rsConnected || !currentRoomId) return;

    const unsubscribe = server.subscribeRoomMyState(currentRoomId, (roomMyState) => {
      setIsReady(roomMyState.isReady ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, [server, rsConnected, currentRoomId]);

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
      // Persist the nickname first: the server's onRoomJoin hook reads it back from
      // global user state to seed this user's room state.
      await server.remoteFunction('setNickname', [nickname]);

      // An explicit id joins that room; without one the server hands out a fresh id.
      const targetRoomId = roomId ?? (await server.remoteFunction('createRoom', []));

      // joinRoom() is the SDK's, not a remote function: it routes the client to the
      // room's Room Server and connects, which is what makes $room state, the room
      // hooks and onRoomMessage available.
      await joinRoom(targetRoomId);
    } catch (err) {
      setError(`Failed to join room: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles leaving the current room
  const handleLeaveRoom = async () => {
    if (!currentRoomId) return; // Do nothing if not in a room

    // leaveRoom() closes the Room Server connection and clears currentRoomId and
    // rsConnected, which tears down the room subscriptions above with it.
    leaveRoom();
    setRoomStarted(false);
    setIsReady(false);
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

    // In a room, but the Room Server connection is not up yet. $room state and the
    // room hooks only work over that second connection, so room UI waits for it.
    if (!rsConnected) {
      return (
        <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-white/90 z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p>Joining room...</p>
          </div>
        </div>
      );
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
