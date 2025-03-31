import React from 'react';

interface MessageProps {
  message: {
    id: string;
    sender: string;
    senderNickname?: string;
    content: string;
    timestamp: number;
    type: 'chat' | 'system';
    systemType?: 'join' | 'leave';
  };
  isCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // System message (join/leave)
  if (message.type === 'system') {
    return (
      <div className="text-center py-2">
        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
          message.systemType === 'join' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {message.content}
        </span>
        <span className="text-xs text-gray-500 ml-1">{formatTime(message.timestamp)}</span>
      </div>
    );
  }

  // Chat message
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${
        isCurrentUser 
          ? 'bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
          : 'bg-gray-200 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
      } px-4 py-2 break-words`}>
        {!isCurrentUser && (
          <div className="font-medium text-sm mb-1">
            {message.senderNickname || message.sender.substring(0, 8) + '...'}
          </div>
        )}
        <div>{message.content}</div>
        <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-right mt-1`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default Message;
