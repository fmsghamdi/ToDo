export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChatNotification {
  id: string;
  chatId: string;
  message: Message;
  isRead: boolean;
}
