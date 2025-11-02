// Hybrid Service: Uses API when available, falls back to localStorage
import { apiService } from './ApiService';
import type { Card, Board } from '../Types';
import type { User } from '../UserTypes';
import type { Chat, Message } from '../ChatTypes';

class HybridService {
  private isApiConnected = false;

  constructor() {
    this.checkApiConnection();
  }

  // Check API connection status
  async checkApiConnection(): Promise<boolean> {
    try {
      this.isApiConnected = await apiService.isApiAvailable();
      return this.isApiConnected;
    } catch {
      this.isApiConnected = false;
      return false;
    }
  }

  // Get connection status for UI indicators
  async getConnectionStatus(): Promise<'connected' | 'local' | 'disconnected'> {
    const apiAvailable = await this.checkApiConnection();
    if (apiAvailable) {
      return 'connected';
    }
    
    // Check if we have local data
    const hasLocalData = localStorage.getItem('boards') || localStorage.getItem('users');
    return hasLocalData ? 'local' : 'disconnected';
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<{ user: User; token?: string } | null> {
    // Always try API first for authentication
    try {
      const response = await apiService.login(email, password);
      return { user: response.user, token: response.token };
    } catch {
      // Fallback to localStorage validation
      const users = this.getLocalUsers();
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (user) {
        // Store current user locally
        localStorage.setItem('currentUserId', user.id);
        return { user };
      }
      
      return null;
    }
  }

  async register(name: string, email: string, password: string): Promise<{ user: User; token?: string } | null> {
    try {
      const response = await apiService.register(name, email, password);
      return { user: response.user, token: response.token };
    } catch {
      // Fallback to local storage
      const users = this.getLocalUsers();
      
      // Check if email already exists
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already exists');
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.toLowerCase(),
        password: password.trim(),
        role: users.length === 0 ? "admin" : "employee", // First user is admin
        permissions: users.length === 0 ? 
          ["view_board", "create_task", "edit_task", "move_task", "delete_task", "manage_board", "view_dashboard", "view_control_panel"] : 
          ["view_board", "create_task", "edit_task", "move_task"],
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUserId', newUser.id);
      
      return { user: newUser };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.logout();
    } catch {
      // Silent fail for API logout
    } finally {
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('authToken');
    }
  }

  // Users Methods
  async getUsers(): Promise<User[]> {
    try {
      if (this.isApiConnected) {
        const apiUsers = await apiService.getUsers();
        // Sync with localStorage
        localStorage.setItem('users', JSON.stringify(apiUsers));
        return apiUsers;
      }
    } catch (error) {
      console.warn('API getUsers failed, using localStorage:', error);
    }
    
    return this.getLocalUsers();
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      if (this.isApiConnected) {
        const apiUser = await apiService.createUser(userData);
        // Update localStorage
        const users = this.getLocalUsers();
        users.push(apiUser);
        localStorage.setItem('users', JSON.stringify(users));
        return apiUser;
      }
    } catch (error) {
      console.warn('API createUser failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const users = this.getLocalUsers();
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      if (this.isApiConnected) {
        const apiUser = await apiService.updateUser(id, userData);
        // Update localStorage
        const users = this.getLocalUsers();
        const updatedUsers = users.map(u => u.id === id ? apiUser : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        return apiUser;
      }
    } catch (error) {
      console.warn('API updateUser failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const users = this.getLocalUsers();
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, ...userData } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return updatedUsers.find(u => u.id === id)!;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (this.isApiConnected) {
        await apiService.deleteUser(id);
        // Update localStorage
        const users = this.getLocalUsers();
        const filteredUsers = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        return true;
      }
    } catch (error) {
      console.warn('API deleteUser failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const users = this.getLocalUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    return true;
  }

  // Boards Methods
  async getBoards(): Promise<Board[]> {
    try {
      if (this.isApiConnected) {
        const apiBoards = await apiService.getBoards();
        // Sync with localStorage
        localStorage.setItem('boards', JSON.stringify(apiBoards));
        return apiBoards;
      }
    } catch (error) {
      console.warn('API getBoards failed, using localStorage:', error);
    }
    
    return this.getLocalBoards();
  }

  async createBoard(boardData: { title: string; description?: string; background?: string }): Promise<Board> {
    try {
      if (this.isApiConnected) {
        const apiBoard = await apiService.createBoard(boardData);
        // Update localStorage
        const boards = this.getLocalBoards();
        boards.push(apiBoard);
        localStorage.setItem('boards', JSON.stringify(boards));
        return apiBoard;
      }
    } catch (error) {
      console.warn('API createBoard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const boards = this.getLocalBoards();
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: boardData.title,
      description: boardData.description || '',
      background: boardData.background || '#3b82f6',
      columns: [
        { id: "todo", title: "قائمة المهام", cards: [], position: 0, isDefault: true },
        { id: "in-progress", title: "قيد التنفيذ", cards: [], position: 1, isDefault: true },
        { id: "done", title: "مكتمل", cards: [], position: 2, isDefault: true },
      ],
      members: [],
      isArchived: false,
      isStarred: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: localStorage.getItem('currentUserId') || '',
    };
    
    boards.push(newBoard);
    localStorage.setItem('boards', JSON.stringify(boards));
    return newBoard;
  }

  async updateBoard(id: string, boardData: Partial<Board>): Promise<Board> {
    try {
      if (this.isApiConnected) {
        const apiBoard = await apiService.updateBoard(id, boardData);
        // Update localStorage
        const boards = this.getLocalBoards();
        const updatedBoards = boards.map(b => b.id === id ? apiBoard : b);
        localStorage.setItem('boards', JSON.stringify(updatedBoards));
        return apiBoard;
      }
    } catch (error) {
      console.warn('API updateBoard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const boards = this.getLocalBoards();
    const updatedBoards = boards.map(b => 
      b.id === id ? { ...b, ...boardData, updatedAt: Date.now() } : b
    );
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
    return updatedBoards.find(b => b.id === id)!;
  }

  async deleteBoard(id: string): Promise<boolean> {
    try {
      if (this.isApiConnected) {
        await apiService.deleteBoard(id);
        // Update localStorage
        const boards = this.getLocalBoards();
        const filteredBoards = boards.filter(b => b.id !== id);
        localStorage.setItem('boards', JSON.stringify(filteredBoards));
        return true;
      }
    } catch (error) {
      console.warn('API deleteBoard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const boards = this.getLocalBoards();
    const filteredBoards = boards.filter(b => b.id !== id);
    localStorage.setItem('boards', JSON.stringify(filteredBoards));
    return true;
  }

  // Cards Methods
  async createCard(boardId: string, columnId: string, cardData: Omit<Card, 'id'>): Promise<Card> {
    const newCard: Card = {
      ...cardData,
      id: `card-${Date.now()}`,
    };

    try {
      if (this.isApiConnected) {
        const apiCard = await apiService.createCard(newCard);
        // Update localStorage
        this.updateLocalBoardCard(boardId, columnId, apiCard, 'create');
        return apiCard;
      }
    } catch (error) {
      console.warn('API createCard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    this.updateLocalBoardCard(boardId, columnId, newCard, 'create');
    return newCard;
  }

  async updateCard(boardId: string, cardData: Card): Promise<Card> {
    try {
      if (this.isApiConnected) {
        const apiCard = await apiService.updateCard(cardData.id, cardData);
        // Update localStorage
        this.updateLocalBoardCardData(boardId, apiCard);
        return apiCard;
      }
    } catch (error) {
      console.warn('API updateCard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    this.updateLocalBoardCardData(boardId, cardData);
    return cardData;
  }

  async deleteCard(boardId: string, cardId: string): Promise<boolean> {
    try {
      if (this.isApiConnected) {
        await apiService.deleteCard(cardId);
        // Update localStorage
        this.removeLocalBoardCard(boardId, cardId);
        return true;
      }
    } catch (error) {
      console.warn('API deleteCard failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    this.removeLocalBoardCard(boardId, cardId);
    return true;
  }

  // Chat Methods (localStorage only for now)
  async getChats(): Promise<Chat[]> {
    try {
      if (this.isApiConnected) {
        return await apiService.getChats();
      }
    } catch (error) {
      console.warn('API getChats failed, using localStorage:', error);
    }
    
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  }

  async createChat(participants: string[]): Promise<Chat> {
    const users = this.getLocalUsers();
    const chatParticipants = participants.map(id => {
      const user = users.find(u => u.id === id);
      return {
        id: user!.id,
        name: user!.name,
        avatar: user!.avatar || "👤"
      };
    });

    const newChat: Chat = {
      id: Date.now().toString(),
      participants: chatParticipants,
      messages: [],
      unreadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const chats = await this.getChats();
    chats.push(newChat);
    localStorage.setItem('chats', JSON.stringify(chats));
    
    return newChat;
  }

  async sendMessage(chatId: string, content: string, senderId: string): Promise<Message> {
    const users = this.getLocalUsers();
    const sender = users.find(u => u.id === senderId);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId,
      senderName: sender?.name || 'Unknown',
      senderAvatar: sender?.avatar,
      content,
      timestamp: Date.now(),
      isRead: true,
    };

    const chats = await this.getChats();
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage,
          updatedAt: Date.now(),
        };
      }
      return chat;
    });

    localStorage.setItem('chats', JSON.stringify(updatedChats));
    return newMessage;
  }

  // Private helper methods
  private getLocalUsers(): User[] {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [];
  }

  private getLocalBoards(): Board[] {
    const saved = localStorage.getItem('boards');
    if (saved) {
      return JSON.parse(saved);
    }
    // Return default board if none exists
    return [{
      id: "default-board",
      title: "اللوحة الرئيسية",
      description: "لوحة المهام الافتراضية",
      columns: [
        { id: "todo", title: "قائمة المهام", cards: [], position: 0, isDefault: true },
        { id: "in-progress", title: "قيد التنفيذ", cards: [], position: 1, isDefault: true },
        { id: "done", title: "مكتمل", cards: [], position: 2, isDefault: true },
      ],
      members: [],
      isArchived: false,
      isStarred: false,
      background: "#3b82f6",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "",
    }];
  }

  private updateLocalBoardCard(boardId: string, columnId: string, card: Card, operation: 'create' | 'update'): void {
    const boards = this.getLocalBoards();
    const updatedBoards = boards.map(board => {
      if (board.id === boardId) {
        const updatedColumns = board.columns.map(col => {
          if (col.id === columnId) {
            if (operation === 'create') {
              return { ...col, cards: [...col.cards, card] };
            } else {
              return { ...col, cards: col.cards.map(c => c.id === card.id ? card : c) };
            }
          }
          return col;
        });
        return { ...board, columns: updatedColumns, updatedAt: Date.now() };
      }
      return board;
    });
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  }

  private updateLocalBoardCardData(boardId: string, card: Card): void {
    const boards = this.getLocalBoards();
    const updatedBoards = boards.map(board => {
      if (board.id === boardId) {
        const updatedColumns = board.columns.map(col => ({
          ...col,
          cards: col.cards.map(c => c.id === card.id ? card : c)
        }));
        return { ...board, columns: updatedColumns, updatedAt: Date.now() };
      }
      return board;
    });
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  }

  private removeLocalBoardCard(boardId: string, cardId: string): void {
    const boards = this.getLocalBoards();
    const updatedBoards = boards.map(board => {
      if (board.id === boardId) {
        const updatedColumns = board.columns.map(col => ({
          ...col,
          cards: col.cards.filter(c => c.id !== cardId)
        }));
        return { ...board, columns: updatedColumns, updatedAt: Date.now() };
      }
      return board;
    });
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  }
}

export const hybridService = new HybridService();
export default hybridService;
