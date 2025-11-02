import React, { useState, useEffect, useRef } from "react";
import type { Chat } from "../ChatTypes";
import type { User } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

interface ChatProps {
  currentUser: User;
  users: User[];
  chats: Chat[];
  onSendMessage: (chatId: string, content: string) => void;
  onCreateChat: (participantIds: string[]) => void;
  onMarkAsRead: (chatId: string) => void;
}

const ChatPage: React.FC<ChatProps> = ({
  currentUser,
  users,
  chats,
  onSendMessage,
  onCreateChat,
  onMarkAsRead,
}) => {
  const { t } = useLanguage();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  // Mark chat as read when selected
  useEffect(() => {
    if (selectedChatId && selectedChat && selectedChat.unreadCount > 0) {
      onMarkAsRead(selectedChatId);
      // Clear chat notifications when messages are read
      const clearFunction = (window as unknown as { clearChatNotifications?: (chatId: string) => void }).clearChatNotifications;
      if (clearFunction) {
        clearFunction(selectedChatId);
      }
    }
  }, [selectedChatId, selectedChat, onMarkAsRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;

    onSendMessage(selectedChatId, messageInput.trim());
    setMessageInput("");
  };

  const handleCreateChat = () => {
    if (selectedUsers.length === 0) return;
    
    onCreateChat([currentUser.id, ...selectedUsers]);
    setShowNewChatModal(false);
    setSelectedUsers([]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getOtherParticipants = (chat: Chat) => {
    return chat.participants.filter(p => p.id !== currentUser.id);
  };

  const getChatTitle = (chat: Chat) => {
    const others = getOtherParticipants(chat);
    if (others.length === 1) {
      return others[0].name;
    }
    return others.map(p => p.name).join(", ");
  };

  const getChatAvatar = (chat: Chat) => {
    const others = getOtherParticipants(chat);
    if (others.length === 1) {
      return others[0].avatar || "👤";
    }
    return "👥";
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-green-50">
          <h2 className="text-xl font-bold text-gray-800">{t.chats}</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-green-600 hover:to-blue-700 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
            title={t.startNewChat}
          >
            <span className="text-xl font-bold">+</span>
            <span className="hidden sm:inline">{t.newChat}</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-8xl mb-6 animate-bounce">💬</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">{t.noChatsYet}</h3>
              <p className="text-gray-600 mb-6 text-sm">{t.selectChatFromList}</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-blue-700 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 mx-auto transform hover:scale-110"
              >
                <span className="text-2xl">+</span>
                <span className="text-lg">{t.startNewChat}</span>
              </button>
            </div>
          ) : (
            chats
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedChatId === chat.id ? "bg-blue-50 border-r-4 border-r-blue-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getChatAvatar(chat)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate">
                          {getChatTitle(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0 mr-2">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.lastMessage.senderId === currentUser.id ? "أنت: " : ""}
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getChatAvatar(selectedChat)}</div>
                <div>
                  <h3 className="font-medium">{getChatTitle(selectedChat)}</h3>
                  <p className="text-sm text-gray-500">
                    {getOtherParticipants(selectedChat).length === 1 ? t.online : `${selectedChat.participants.length} ${t.chatMembers}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedChat.messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  {t.startConversation}
                </div>
              ) : (
                selectedChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {message.senderId !== currentUser.id && (
                        <div className="text-xs font-medium mb-1 opacity-75">
                          {message.senderName}
                        </div>
                      )}
                      <div className="break-words">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.senderId === currentUser.id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={t.typeMessage}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.send}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-8xl mb-6 animate-pulse">💬</div>
              <h3 className="text-xl font-bold mb-4 text-gray-700">{t.selectChatToStart}</h3>
              <p className="text-base mb-6 text-gray-600">{t.selectChatFromList}</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-blue-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto transform hover:scale-105"
              >
                <span className="text-xl">+</span>
                {t.startNewChat}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{t.newChat}</h3>
            
            <div className="space-y-2 mb-4">
              {users
                .filter(user => user.id !== currentUser.id)
                .map((user) => (
                  <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="text-lg">{user.avatar || "👤"}</div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.role === "admin" ? "مدير" : "موظف"}</div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedUsers([]);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {t.createChat}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
