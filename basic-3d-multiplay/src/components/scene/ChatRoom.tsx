import { useState, useEffect, useRef } from "react";
import { useRoomState, useRoomAllUserStates } from "@agent8/gameserver";
import Message from "../Message";

interface ChatRoomProps {
  roomId: string;
  onLeaveRoom: () => Promise<void>;
  server: any;
}

interface MessageData {
  id: string;
  sender: string;
  senderNickname?: string;
  content: string;
  timestamp: number;
  type: "chat" | "system";
  systemType?: "join" | "leave";
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLeaveRoom, server }) => {
  const roomState = useRoomState();
  const userStates = useRoomAllUserStates();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to chat messages
  useEffect(() => {
    if (!server) return;

    // Handle chat messages
    const unsubscribeChatMessage = server.onRoomMessage(
      roomId,
      "chat-message",
      (message: any) => {
        const newMsg: MessageData = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: message.sender,
          senderNickname: message.senderNickname,
          content: message.content,
          timestamp: message.timestamp,
          type: "chat",
        };

        setMessages((prev) => [...prev, newMsg]);
      }
    );

    // Handle system messages (join/leave)
    const unsubscribeSystemMessage = server.onRoomMessage(
      roomId,
      "system-message",
      (message: any) => {
        const newMsg: MessageData = {
          id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: message.account,
          senderNickname: message.nickname,
          content:
            message.type === "join"
              ? `${message.nickname}님이 입장하셨습니다.`
              : `${message.nickname}님이 퇴장하셨습니다.`,
          timestamp: message.timestamp,
          type: "system",
          systemType: message.type,
        };

        setMessages((prev) => [...prev, newMsg]);
      }
    );

    return () => {
      unsubscribeChatMessage();
      unsubscribeSystemMessage();
    };
  }, [server, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);

    try {
      await server.remoteFunction("sendMessage", [newMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
        <div>
          <h2 className="text-lg font-semibold">채팅방: {roomId}</h2>
          <p className="text-sm text-gray-600">참가자: {userStates.length}명</p>
        </div>
        <button
          onClick={onLeaveRoom}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
        >
          방 나가기
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>아직 메시지가 없습니다.</p>
                <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    isCurrentUser={msg.sender === server.account}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="p-3 border-t">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition duration-200 disabled:opacity-50"
              >
                전송
              </button>
            </form>
          </div>
        </div>

        {/* Participants sidebar */}
        <div className="w-64 border-l bg-gray-50 overflow-y-auto">
          <div className="p-3 border-b">
            <h3 className="font-medium">참가자 목록</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {userStates.map((user) => (
              <li key={user.account} className="p-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium">
                  {user.nickname || user.account.substring(0, 8) + "..."}
                </span>
                {user.account === server.account && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    나
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
