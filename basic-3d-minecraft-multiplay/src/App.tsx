import { useState, useEffect } from 'react';
import { useGameServer, useRoomUserState } from '@agent8/gameserver';
import './App.css';
import NicknameSetup from './components/scene/NicknameSetup';
import RoomManager from './components/scene/RoomManager';
import LobbyRoom from './components/scene/LobbyRoom';
import { GameScene } from './components/scene/GameScene';
import { networkSyncStore } from './store/networkSyncStore';

function App() {
  const { connected, server, account, joinRoom, leaveRoom, currentRoomId, rsConnected } = useGameServer();
  const [nickname, setNickname] = useState<string | null>(null);
  // currentRoomId and rsConnected come from useGameServer(): the SDK owns room membership.
  const [roomStarted, setRoomStarted] = useState(false);
  const roomUserState = useRoomUserState(account); // Current user's state in the room
  const [isLoading, setIsLoading] = useState(false); // Loading state for async operations
  const [error, setError] = useState<string | null>(null); // Error message state

  useEffect(() => {
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
      // Absent until toggleReady() first writes it — onRoomCreate no longer seeds it.
      setRoomStarted(roomState.gameStarted ?? false);
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
      // Both must land before joinRoom — onRoomJoin reads the nickname back out of
      // global user state — but they do not depend on each other, so they go in
      // parallel. An explicit id joins that room; without one the server hands out
      // a fresh id.
      const [, targetRoomId] = await Promise.all([
        server.remoteFunction('setNickname', [nickname]),
        roomId ?? server.remoteFunction('createRoom', []),
      ]);

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
            {error && <p className="mt-2 text-red-600">{error}</p>}
            {/* The SDK keeps retrying on its own, but a player who is stuck here
                (or who simply changed their mind) needs a way out. */}
            <button
              onClick={handleLeaveRoom}
              className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Show game scene if the game has started and the user is ready
    // Note: Character selection check might be needed here or handled within GameScene/LobbyRoom
    if (roomStarted && roomUserState?.isReady) {
      return <GameScene roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} />;
    }

    // Otherwise, show the lobby room. Unconditional on purpose: roomStarted and
    // isReady arrive on two independent subscriptions, so between the two
    // callbacks of a single toggleReady a guarded form would match no branch at
    // all and renderContent() would return undefined — a blank screen.
    return <LobbyRoom roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} server={server} />;
  };

  return (
    <div className="min-h-screen">
      {/* Render the determined content */}
      <div>{renderContent()}</div>
    </div>
  );
}

export default App;
