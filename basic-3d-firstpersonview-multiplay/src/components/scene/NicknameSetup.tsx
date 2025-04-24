import { useState } from 'react';

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

const NicknameSetup: React.FC<NicknameSetupProps> = ({ onNicknameSet, isLoading, error }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onNicknameSet(nickname.trim());
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-sm p-6 bg-gray-100 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-5 text-center">Player Setup</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block mb-1 text-sm font-medium text-gray-700">
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nickname"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !nickname.trim()}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>

          {error && <div className="mt-3 p-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default NicknameSetup;
