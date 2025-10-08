// API Service for connecting to backend
import type { Card, Board, Column } from '../Types';
import type { User } from '../UserTypes';
import type { Chat, Message } from '../ChatTypes';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  isRead: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
}

interface ChatData {
  participants: { id: string; name: string; avatar: string }[];
  title?: string;
}

interface MessageData {
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Try to detect environment and set appropriate URL
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168.');
    
    if (isProduction) {
      // In production, API should be on the same domain via Nginx
      this.baseUrl = '/api';
    } else {
      // For local development, try multiple possible URLs
      this.baseUrl = 'http://localhost:5000/api';
    }
    
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get headers with authentication
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API call method
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it
          this.clearToken();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { success: true } as T;
      }
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.apiCall('/health');
  }

  // Authentication API
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password } as LoginRequest),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password } as RegisterRequest),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.apiCall('/auth/current');
  }

  async forgotPassword(email: string): Promise<ApiResponse<string>> {
    return this.apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Users API
  async getUsers(): Promise<User[]> {
    return this.apiCall('/users');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async changePassword(userId: string, newPassword: string, currentPassword?: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/users/${userId}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    });
  }

  // Boards API
  async getBoards(): Promise<Board[]> {
    return this.apiCall('/boards');
  }

  async createBoard(boardData: { title: string; description?: string; background?: string }): Promise<Board> {
    return this.apiCall('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
  }

  async updateBoard(id: string, boardData: { title?: string; description?: string; background?: string }): Promise<Board> {
    return this.apiCall(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(boardData),
    });
  }

  async deleteBoard(id: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Columns API
  async getColumns(): Promise<Column[]> {
    return this.apiCall('/columns');
  }

  async getColumnsByBoard(boardId: string): Promise<Column[]> {
    return this.apiCall(`/boards/${boardId}/columns`);
  }

  async createColumn(columnData: { title: string; boardId: string; position: number }): Promise<Column> {
    return this.apiCall('/columns', {
      method: 'POST',
      body: JSON.stringify(columnData),
    });
  }

  async updateColumn(id: string, columnData: { title?: string; position?: number }): Promise<Column> {
    return this.apiCall(`/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(columnData),
    });
  }

  async deleteColumn(id: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/columns/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderColumn(id: string, newPosition: number): Promise<ApiResponse<string>> {
    return this.apiCall(`/columns/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ newPosition }),
    });
  }

  // Cards API
  async getCards(): Promise<Card[]> {
    return this.apiCall('/cards');
  }

  async getCardsByColumn(columnId: string): Promise<Card[]> {
    return this.apiCall(`/columns/${columnId}/cards`);
  }

  async createCard(cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    return this.apiCall('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  async updateCard(id: string, cardData: Partial<Card>): Promise<Card> {
    return this.apiCall(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    });
  }

  async deleteCard(id: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/cards/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications API
  async getNotifications(): Promise<Notification[]> {
    return this.apiCall('/notifications');
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.apiCall('/notifications/unread');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<string>> {
    return this.apiCall(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<string>> {
    return this.apiCall('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async createNotification(notificationData: CreateNotificationRequest): Promise<Notification> {
    return this.apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  // Chat API (placeholder - would need to implement these endpoints)
  async getChats(): Promise<Chat[]> {
    try {
      return this.apiCall('/chats');
    } catch {
      // Fallback to localStorage if API not available
      const saved = localStorage.getItem('chats');
      return saved ? JSON.parse(saved) : [];
    }
  }

  async createChat(chatData: ChatData): Promise<Chat> {
    try {
      return this.apiCall('/chats', {
        method: 'POST',
        body: JSON.stringify(chatData),
      });
    } catch {
      // Fallback to localStorage
      const newChat: Chat = {
        id: Date.now().toString(),
        participants: chatData.participants,
        messages: [],
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessage: undefined,
      };
      return newChat;
    }
  }

  async sendMessage(chatId: string, messageData: MessageData): Promise<Message> {
    try {
      return this.apiCall(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
    } catch {
      // Fallback to localStorage
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderAvatar: messageData.senderAvatar,
        content: messageData.content,
        timestamp: Date.now(),
        isRead: false,
      };
      return newMessage;
    }
  }

  // Test if API server is available
  async isApiAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }

  // Test connection and return status
  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'local'> {
    try {
      await this.checkHealth();
      return 'connected';
    } catch {
      // Check if we have local data
      const hasLocalData = localStorage.getItem('boards') || localStorage.getItem('users');
      return hasLocalData ? 'local' : 'disconnected';
    }
  }
}

export const apiService = new ApiService();
export default apiService;
