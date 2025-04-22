import { useState } from 'react';

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

const RoomManager: React.FC<RoomManagerProps> = ({ onJoinRoom, onBack, nickname, isLoading, error }) => {
  const [roomId, setRoomId] = useState('');

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
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex justify-start">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Nickname
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-center">Room Management</h2>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <span className="font-medium text-gray-700">Nickname:</span>
        {nickname}
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">Create New Room</h3>
        <p className="text-sm text-gray-600 mb-4">Start a new game room and invite others.</p>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create New Room'}
        </button>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">Join Existing Room</h3>
        <p className="text-sm text-gray-600 mb-4">Enter a Room ID provided by another player.</p>
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block mb-1 text-sm font-medium text-gray-700">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !roomId.trim()}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>

      {error && <div className="mt-4 p-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div>}
    </div>
  );
};

export default RoomManager;
