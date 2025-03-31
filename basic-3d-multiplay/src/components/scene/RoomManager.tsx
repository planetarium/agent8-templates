import { useState } from "react";

/**
 * Room manager props
 */
interface RoomManagerProps {
  /** Handler for joining room */
  onJoinRoom: (roomId?: string) => Promise<void>;
  /** Handler for going back */
  onBack: () => void;
  /** User's nickname */
  nickname: string;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

const RoomManager: React.FC<RoomManagerProps> = ({
  onJoinRoom,
  onBack,
  nickname,
  isLoading,
  error,
}) => {
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    onJoinRoom(undefined); // No roomId means create a new room
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={onBack} className="text-blue-600 mb-4">
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-6">Room Management</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
        <div className="font-semibold">Nickname:</div>
        <div>{nickname}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">Create New Room</h3>
        <p className="text-gray-600 text-sm mb-4">
          Create a new game room. Other players can join your room.
        </p>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create New Room"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">Join Existing Room</h3>
        <p className="text-gray-600 text-sm mb-4">
          Enter a Room ID to join an existing room.
        </p>
        <form onSubmit={handleJoinRoom}>
          <div className="mb-4">
            <label htmlFor="roomId" className="block mb-2 text-sm font-medium">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !roomId.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default RoomManager;
