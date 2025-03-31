import { useState } from "react";

/**
 * Nickname setup props
 */
interface NicknameSetupProps {
  /** Handler for setting nickname */
  onNicknameSet: (nickname: string) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

const NicknameSetup: React.FC<NicknameSetupProps> = ({
  onNicknameSet,
  isLoading,
  error,
}) => {
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onNicknameSet(nickname.trim());
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <div className="bg-white rounded-md shadow-sm p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Player Setup</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter a nickname to use in the game.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="nickname"
              className="block mb-2 text-sm font-medium"
            >
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nickname"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !nickname.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Continue"}
          </button>

          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NicknameSetup;
