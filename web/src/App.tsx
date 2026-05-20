import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import CardModal from "./CardModal";
import type { Card, Column, AssignRequest } from "./Types";
import AddTaskModal from "./AddTaskModal";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import TenantRegister from "./pages/TenantRegister";
import PasswordChangeModal from "./components/PasswordChangeModal";
import ChatPage from "./pages/Chat";
import ColumnManager from "./components/ColumnManager";
import SearchAndFilter from "./components/SearchAndFilter";
import NotificationSystem from "./components/NotificationSystem";
import CalendarView from "./pages/CalendarView";
import SystemSettings from "./pages/SystemSettings";
import BoardManager from "./components/BoardManager";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Logo from "./components/Logo";
import type { User, Permission } from "./UserTypes";
import { DEFAULT_ADMIN_PERMISSIONS } from "./UserTypes";
import type { Chat, Message } from "./ChatTypes";
import type { Board } from "./Types";
import { useLanguage } from "./i18n/useLanguage";
import AdvancedReports from "./pages/AdvancedReports";
import Integrations from "./pages/Integrations";
import Workflows from "./pages/Workflows";
import Timeline from "./pages/Timeline";
import DataStorageIndicator from "./components/DataStorageIndicator";
import TrialBanner from "./components/TrialBanner";
import SubscriptionPanel from "./components/SubscriptionPanel";
import { workflowService } from './services/WorkflowService';
import { workflowExecutionEngine } from './services/WorkflowExecutionEngine';
import { authService, type ADUser } from './services/AuthService';
import { apiService } from './services/ApiService';

type View = "board" | "dashboard" | "control" | "chat" | "calendar" | "settings" | "reports" | "integrations" | "workflows" | "timeline" | "subscription";

const App: React.FC = () => {
  const { language, t } = useLanguage();

  // Users management
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => 
    localStorage.getItem("currentUserId")
  );

  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register" | "forgot" | "tenant-register">("login");
  
  // Password change modal state
  const [passwordChangeModal, setPasswordChangeModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  const currentUser = users.find(u => u.id === currentUserId);

  // Boards state
  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = localStorage.getItem("boards");
    if (saved) {
      return JSON.parse(saved);
    }
    // Create default board
    const defaultBoard: Board = {
      id: "default-board",
      title: language === 'ar' ? "اللوحة الرئيسية" : "Main Board",
      description: t.defaultTaskBoard,
        columns: [
          { id: "todo", title: language === 'ar' ? "قائمة المهام" : "To Do", cards: [], position: 0, isDefault: true, createdAt: Date.now() },
          { id: "in-progress", title: language === 'ar' ? "قيد التنفيذ" : "In Progress", cards: [], position: 1, isDefault: true, createdAt: Date.now() },
          { id: "on-hold", title: language === 'ar' ? "معلّقة" : "On Hold", cards: [], position: 2, isDefault: true, createdAt: Date.now() },
          { id: "done", title: language === 'ar' ? "مكتمل" : "Done", cards: [], position: 3, isDefault: true, createdAt: Date.now() },
        ],
      members: [],
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "",
      background: "#3b82f6",
      isStarred: false,
    };
    return [defaultBoard];
  });

  const [currentBoardId, setCurrentBoardId] = useState<string>(() => {
    const saved = localStorage.getItem("currentBoardId");
    return saved || "default-board";
  });

  const [assignRequests, setAssignRequests] = useState<AssignRequest[]>(() => {
    const saved = localStorage.getItem("assignRequests");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("assignRequests", JSON.stringify(assignRequests));
  }, [assignRequests]);

  const currentBoard = boards.find(b => b.id === currentBoardId) || boards[0];
  const columns = currentBoard?.columns || [];

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<string | null>(null);

  // Search and filter state
  const [filteredColumns, setFilteredColumns] = useState<Column[] | null>(null);

  // Mobile column manager toggle
  const [showColumnsManager, setShowColumnsManager] = useState(false);

  // Chat state
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : [];
  });

    // Helper to decode JWT payload
  const decodeJwt = (token: string): Record<string, any> | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  // Apply tenant branding to CSS variables
  const applyBranding = (branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    name?: string;
  }) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', branding.primaryColor || '#D97706');
    root.style.setProperty('--secondary', branding.secondaryColor || '#059669');

    const darken = (hex: string, amount: number) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.max(0, (num >> 16) - amount);
      const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
      const b = Math.max(0, (num & 0x0000FF) - amount);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    const lighten = (hex: string, amount: number) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, (num >> 16) + amount);
      const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
      const b = Math.min(255, (num & 0x0000FF) + amount);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    root.style.setProperty('--primary-dark', darken(branding.primaryColor || '#D97706', 30));
    root.style.setProperty('--primary-darkest', darken(branding.primaryColor || '#D97706', 60));
    root.style.setProperty('--primary-light', lighten(branding.primaryColor || '#D97706', 50));
    root.style.setProperty('--primary-bright', lighten(branding.primaryColor || '#D97706', 90));
    root.style.setProperty('--secondary-light', lighten(branding.secondaryColor || '#059669', 50));

    if (branding.logoUrl) {
      root.style.setProperty('--tenant-logo-url', `url(${branding.logoUrl})`);
      localStorage.setItem('tenantLogoUrl', branding.logoUrl);
    }
    if (branding.name) {
      localStorage.setItem('tenantName', branding.name);
    }
  };

  // Load tenant branding on mount or when user changes
  useEffect(() => {
    const loadBranding = async () => {
      const token = localStorage.getItem('authToken');
      let tenantId: number | null = null;

      if (token) {
        const claims = decodeJwt(token);
        if (claims?.TenantId) {
          tenantId = parseInt(claims.TenantId);
        }
      }

      // Also check user object in state
      if (!tenantId && currentUser?.tenantId) {
        tenantId = currentUser.tenantId;
      }

      if (tenantId) {
        try {
          const branding = await apiService.getTenantBranding(tenantId);
          applyBranding(branding);
        } catch (err) {
          console.warn('Failed to load tenant branding:', err);
        }
      }
    };

    loadBranding();
  }, [currentUserId]);

  // Auto-save boards, users, and chats
  useEffect(() => {
    localStorage.setItem("boards", JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    localStorage.setItem("currentBoardId", currentBoardId);
  }, [currentBoardId]);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem("currentUserId", currentUserId);
    } else {
      localStorage.removeItem("currentUserId");
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Auth handlers
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    if (!email.includes("@")) return t.invalidEmail;
    if (password.length < 4) return t.passwordTooShort;
    
    // First try localStorage users
    const localUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (localUser) {
      setCurrentUserId(localUser.id);
      return null;
    }

    // Fallback to API
    try {
      const response = await apiService.login(email, password);
      const apiUser: User = {
        id: response.user.id.toString(),
        name: response.user.fullName || response.user.username,
        email: response.user.email,
        password: '',
        role: response.user.role,
        permissions: response.user.role === 'admin' ? [...DEFAULT_ADMIN_PERMISSIONS] : ['view_board', 'create_task', 'edit_task', 'move_task'],
        tenantId: response.user.tenantId,
      };
      setUsers(prev => [...prev.filter(u => u.email !== apiUser.email), apiUser]);
      setCurrentUserId(apiUser.id);
      return null;
    } catch {
      return t.invalidCredentials;
    }
  };

  const handleRegister = (name: string, email: string, password: string): string | null => {
    if (!name.trim()) return t.nameRequired;
    if (!email.includes("@")) return t.invalidEmail;
    if (password.length < 4) return t.passwordTooShort;
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return t.emailExists;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase(),
      password: password.trim(),
      role: "admin", // First user is admin
      permissions: [...DEFAULT_ADMIN_PERMISSIONS],
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    return null;
  };

  // Forgot password handler
  const handleForgotPassword = async (email: string): Promise<string | null> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return language === 'ar' 
        ? 'البريد الإلكتروني غير مسجل في النظام'
        : 'Email not found in the system';
    }
    
    // In a real app, this would send an email with reset link
    // For now, we'll simulate success
    console.log(`Password reset link would be sent to: ${email}`);
    return null; // Success
  };

  // Password change handler
  const handlePasswordChange = async (userId: string, newPassword: string, currentPassword?: string): Promise<string | null> => {
    const user = users.find(u => u.id === userId);
    if (!user) return t.error;

    // If changing own password, verify current password
    if (currentPassword !== undefined && user.password !== currentPassword) {
      return t.currentPasswordIncorrect;
    }

    // Update password
    handleUpdateUser(userId, { password: newPassword });
    return null; // Success
  };

  // Handle AD Login
  const handleADLogin = (adUser: ADUser) => {
    // Check if user already exists
    const existingUser = users.find(u => u.email === adUser.email || u.id === adUser.id);
    
    if (existingUser) {
      // User exists, just log them in without creating duplicate
      // Keep their existing permissions and settings
      setCurrentUserId(existingUser.id);
      return;
    }

    // Convert AD user to local user format (only for new users)
    const localUser: User = {
      id: adUser.id,
      name: adUser.displayName,
      email: adUser.email,
      password: '', // AD users don't need local passwords
      role: adUser.groups.includes('Administrators') ? 'admin' : 'employee',
      permissions: adUser.groups.includes('Administrators') ? [...DEFAULT_ADMIN_PERMISSIONS] : ['view_board', 'create_task', 'edit_task', 'move_task'],
      avatar: '👤',
      department: adUser.department,
      title: adUser.title,
      isADUser: true
    };

    // Add new AD user only if they don't exist
    setUsers(prev => [...prev, localUser]);

    // Set as current user
    setCurrentUserId(adUser.id);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUserId(null);
    setView("board");
  };

  // User management handlers
  const handleAddUser = (userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => {
      const updatedUsers = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      // Force save to localStorage immediately for AD users
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Permission check helper
  const hasPermission = (permission: Permission) => {
    return currentUser?.permissions.includes(permission) || false;
  };

  // Check if user can see/edit a specific task
  const canAccessTask = (card: Card) => {
    // Admins can see all tasks
    if (currentUser?.role === "admin") return true;
    
    // Employees can only see tasks they're assigned to
    return card.members.some(member => member.id === currentUserId);
  };

  // Filter columns to show only accessible tasks
  const getFilteredColumns = () => {
    if (currentUser?.role === "admin") {
      return columns;
    }
    
    // For employees, filter out tasks they're not assigned to
    return columns.map(col => ({
      ...col,
      cards: col.cards.filter(canAccessTask)
    }));
  };
  // Open/Close card
  const openCard = (card: Card) => setSelectedCard(card);
  const closeCard = () => setSelectedCard(null);

  // Update Card (with auto-move)
  const updateCard = (updated: Card) => {
    // Check if user has permission to edit tasks and can access this specific task
    if (!hasPermission("edit_task") || !canAccessTask(updated)) return;

    let newCols = columns.map((col) => ({
      ...col,
      cards: col.cards.map((c) => (c.id === updated.id ? updated : c)),
    }));

    // Auto-move logic
    const col = columns.find((c) => c.cards.some((t) => t.id === updated.id));
    if (col) {
      if (updated.subtasks.length > 0) {
        const completed = updated.subtasks.filter((s) => s.done).length;
        const allDone = completed === updated.subtasks.length;

        if (allDone && col.id !== "done") {
          // move to Done
          newCols = newCols.map((c) =>
            c.id === col.id
              ? { ...c, cards: c.cards.filter((t) => t.id !== updated.id) }
              : c.id === "done"
              ? { ...c, cards: [...c.cards, updated] }
              : c
          );
        } else if (!allDone && col.id === "todo") {
          // move from ToDo → In Progress if has subtasks
          newCols = newCols.map((c) =>
            c.id === "todo"
              ? { ...c, cards: c.cards.filter((t) => t.id !== updated.id) }
              : c.id === "in-progress"
              ? { ...c, cards: [...c.cards, updated] }
              : c
          );
        }
      }
    }

    updateBoardColumns(newCols);

    if (selectedCard?.id === updated.id) {
      setSelectedCard(updated);
    }
  };

  // Delete Card
  const deleteCard = (cardId: string) => {
    // Check if user has permission to delete tasks
    if (!hasPermission("delete_task")) return;

    // Find the card to check access
    const cardToDelete = columns.flatMap(col => col.cards).find(card => card.id === cardId);
    if (cardToDelete && !canAccessTask(cardToDelete)) return;

    const newColumns = columns.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) }));
    updateBoardColumns(newColumns);
    setSelectedCard(null);
  };

  // Add Card
  const addCard = async (columnId: string, card: Card) => {
    // For employees, automatically assign them to the task if they're not already assigned
    if (currentUser?.role === "employee" && !card.members.some(m => m.id === currentUserId)) {
      card.members.push({
        id: currentUserId!,
        name: currentUser.name,
        avatar: currentUser.avatar || "👤"
      });
    }

    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
    );
    updateBoardColumns(newColumns);

    // 🚀 WORKFLOW AUTOMATION: Trigger workflows when task is created
    if (currentUser) {
      try {
        // Initialize workflow execution engine with current data
        workflowExecutionEngine.initialize(
          boards,
          users,
          (updatedBoards) => setBoards(updatedBoards),
          (userId, message) => {
            // Send notification (you can integrate with your notification system)
            console.log(`🔔 Notification for ${users.find(u => u.id === userId)?.name}: ${message}`);
            alert(`إشعار: ${message}`);
          }
        );

        // Trigger task_created workflows
        await workflowService.handleTaskEvent('task_created', card, currentUser.id);
        console.log(`✅ Workflows triggered for new task: ${card.title}`);
      } catch (error) {
        console.error('Failed to trigger workflows:', error);
      }
    }
  };

  // Drag & Drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // Check if user has permission to move tasks
    if (!hasPermission("move_task")) return;

    const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const newCols = [...columns];
    const sourceCol = { ...newCols[sourceColIndex] };
    const destCol = { ...newCols[destColIndex] };
    const cardToMove = sourceCol.cards[source.index];

    // Check if user can access the task being moved
    if (!canAccessTask(cardToMove)) return;

    const [moved] = sourceCol.cards.splice(source.index, 1);
    destCol.cards.splice(destination.index, 0, moved);

    newCols[sourceColIndex] = sourceCol;
    newCols[destColIndex] = destCol;
    updateBoardColumns(newCols);
  };

  // Chat handlers
  const handleSendMessage = (chatId: string, content: string) => {
    if (!currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      timestamp: Date.now(),
      isRead: true, // Messages sent by current user are automatically read
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage,
          updatedAt: Date.now(),
        };
        return updatedChat;
      }
      return chat;
    }));
  };

  const handleCreateChat = (participantIds: string[]) => {
    if (!currentUser) return;

    // Check if chat already exists with same participants
    const existingChat = chats.find(chat => {
      const chatParticipantIds = chat.participants.map(p => p.id).sort();
      const newParticipantIds = participantIds.sort();
      return chatParticipantIds.length === newParticipantIds.length &&
             chatParticipantIds.every((id, index) => id === newParticipantIds[index]);
    });

    if (existingChat) {
      // Switch to existing chat
      setView("chat");
      return;
    }

    const participants = participantIds.map(id => {
      const user = users.find(u => u.id === id);
      return {
        id: user!.id,
        name: user!.name,
        avatar: user!.avatar || "👤"
      };
    });

    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      messages: [],
      unreadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats(prev => [...prev, newChat]);
    setView("chat");
  };

  const handleMarkAsRead = (chatId: string) => {
    if (!currentUser) return;

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          unreadCount: 0,
          messages: chat.messages.map(msg => ({
            ...msg,
            // Mark all messages as read
            isRead: true
          }))
        };
      }
      return chat;
    }));
  };

  // Get total unread messages count
  const getTotalUnreadCount = () => {
    if (!currentUser) return 0;
    return chats.reduce((total, chat) => {
      // Count unread messages for current user (messages from others that are not read)
      const unreadMessages = chat.messages.filter(msg => 
        msg.senderId !== currentUser.id && !msg.isRead
      ).length;
      return total + unreadMessages;
    }, 0);
  };

  // Clear all unread messages (for debugging/fixing the issue)
  const clearAllUnreadMessages = () => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      unreadCount: 0,
      messages: chat.messages.map(msg => ({
        ...msg,
        isRead: true
      }))
    })));
  };

  // Update current board columns
  const updateBoardColumns = (newColumns: Column[]) => {
    if (!currentBoard) return;
    
    setBoards(prev => prev.map(board => 
      board.id === currentBoard.id 
        ? { ...board, columns: newColumns, updatedAt: Date.now() }
        : board
    ));
  };

  // Column management handlers
  const handleAddColumn = (title: string) => {
    if (!hasPermission("manage_board")) return;
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: title.trim(),
      cards: [],
      position: columns.length,
      isDefault: false,
      createdAt: Date.now(),
    };
    
    const newColumns = [...columns, newColumn];
    updateBoardColumns(newColumns);
  };

  const handleUpdateColumn = (columnId: string, title: string) => {
    if (!hasPermission("manage_board")) return;
    
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, title: title.trim() } : col
    );
    updateBoardColumns(newColumns);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!hasPermission("manage_board")) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column || column.isDefault) return; // Can't delete default columns
    
    // Move all cards from deleted column to the first column
    const firstColumn = columns[0];
    let newColumns;
    if (column.cards.length > 0 && firstColumn) {
      newColumns = columns.map(col => {
        if (col.id === firstColumn.id) {
          return { ...col, cards: [...col.cards, ...column.cards] };
        }
        return col;
      }).filter(col => col.id !== columnId);
    } else {
      newColumns = columns.filter(col => col.id !== columnId);
    }
    updateBoardColumns(newColumns);
  };

  // Removed unused handleReorderColumns function

  // Search and filter handlers
  const handleFilteredResults = (filtered: Column[]) => {
    setFilteredColumns(filtered);
  };

  const handleClearFilters = () => {
    setFilteredColumns(null);
  };

  // Get columns to display (filtered or original)
  const getDisplayColumns = () => {
    const baseColumns = filteredColumns || getFilteredColumns();
    return baseColumns.sort((a, b) => a.position - b.position);
  };

  // Board management handlers
  const handleCreateBoard = (boardData: Omit<Board, "id" | "createdAt" | "updatedAt">) => {
    const newBoard: Board = {
      ...boardData,
      id: `board-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser?.id || "",
    };
    
    setBoards(prev => [...prev, newBoard]);
    setCurrentBoardId(newBoard.id);
  };

  const handleSelectBoard = (boardId: string) => {
    setCurrentBoardId(boardId);
  };

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(prev => prev.map(board => 
      board.id === boardId 
        ? { ...board, ...updates, updatedAt: Date.now() }
        : board
    ));
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) return; // Can't delete the last board
    
    setBoards(prev => prev.filter(board => board.id !== boardId));
    
    // If deleting current board, switch to first available board
    if (currentBoardId === boardId) {
      const remainingBoards = boards.filter(board => board.id !== boardId);
      if (remainingBoards.length > 0) {
        setCurrentBoardId(remainingBoards[0].id);
      }
    }
  };

  const handleArchiveBoard = (boardId: string) => {
    const activeBoards = boards.filter(b => !b.isArchived);
    if (activeBoards.length <= 1) return; // Can't archive the last active board
    handleUpdateBoard(boardId, { isArchived: true });
    if (currentBoardId === boardId) {
      const nextBoard = activeBoards.find(b => b.id !== boardId);
      if (nextBoard) setCurrentBoardId(nextBoard.id);
    }
  };

  const handleUnarchiveBoard = (boardId: string) => {
    handleUpdateBoard(boardId, { isArchived: false });
  };

  const handleStarBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      handleUpdateBoard(boardId, { isStarred: !board.isStarred });
    }
  };

  // Board export handlers
  const handleExportBoard = (format: "json" | "csv") => {
    if (!currentBoard) return;
    const fileName = `${currentBoard.title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}`;

    if (format === "json") {
      const exportData = {
        title: currentBoard.title,
        description: currentBoard.description,
        exportedAt: new Date().toISOString(),
        columns: currentBoard.columns.map(col => ({
          title: col.title,
          cards: col.cards.map(card => ({
            title: card.title,
            description: card.description,
            priority: card.priority,
            dueDate: card.dueDate,
            labels: card.labels.map(l => l.name),
            members: card.members.map(m => m.name),
            subtasks: card.subtasks.map(s => ({ title: s.title, done: s.done })),
            comments: card.comments.map(c => ({ text: c.text })),
          })),
        })),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows: string[][] = [];
      const BOM = "\uFEFF";
      rows.push(["المهمة", "الوصف", "الأولوية", "تاريخ الاستحقاق", "التصنيفات", "الأعضاء", "المهام الفرعية", "التعليقات"]);
      currentBoard.columns.forEach(col => {
        col.cards.forEach(card => {
          rows.push([
            card.title,
            card.description,
            card.priority || "",
            card.dueDate || "",
            card.labels.map(l => l.name).join("; "),
            card.members.map(m => m.name).join("; "),
            card.subtasks.map(s => `${s.title} (${s.done ? "✓" : "○"})`).join("; "),
            card.comments.map(c => c.text).join(" | "),
          ]);
        });
      });
      const csv = BOM + rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Assign request handlers
  const handleRequestAssign = (req: Omit<AssignRequest, "id" | "createdAt" | "updatedAt">) => {
    const newReq: AssignRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: Date.now(),
    };
    setAssignRequests(prev => [...prev, newReq]);
    if (window.addNotification) {
      window.addNotification({
        type: "assign_requested",
        title: "طلب تعيين جديد",
        message: `المستخدم ${req.userName} طلب التعيين في مهمة "${req.cardTitle}"`,
        cardId: req.cardId,
        cardTitle: req.cardTitle,
        priority: "medium",
      });
    }
  };

  const handleApproveAssign = (reqId: string) => {
    const req = assignRequests.find(r => r.id === reqId);
    if (!req) return;
    setAssignRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: "approved", updatedAt: Date.now() } : r
    ));
    // Add the user as member to the card in the current board
    setBoards(prev => prev.map(board => ({
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.map(card =>
          card.id === req.cardId
            ? { ...card, members: [...card.members, { id: req.userId, name: req.userName, avatar: req.userAvatar || "👤" }] }
            : card
        ),
      })),
    })));
    if (window.addNotification) {
      window.addNotification({
        type: "assign_approved",
        title: "تم قبول طلب التعيين",
        message: `تمت الموافقة على تعيين ${req.userName} في مهمة "${req.cardTitle}"`,
        cardId: req.cardId,
        cardTitle: req.cardTitle,
        priority: "low",
      });
    }
  };

  const handleRejectAssign = (reqId: string) => {
    setAssignRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: "rejected", updatedAt: Date.now() } : r
    ));
    const req = assignRequests.find(r => r.id === reqId);
    if (req && window.addNotification) {
      window.addNotification({
        type: "assign_rejected",
        title: "تم رفض طلب التعيين",
        message: `تم رفض تعيين ${req.userName} في مهمة "${req.cardTitle}"`,
        cardId: req.cardId,
        cardTitle: req.cardTitle,
        priority: "low",
      });
    }
  };

  // Removed unused getSortedColumns function

  // Helper: derive display title for default columns based on current language
  const getColumnTitle = (col: Column) => {
    if (col.isDefault) {
      if (col.id === "todo") return t.todo;
      if (col.id === "in-progress") return t.inProgress;
      if (col.id === "on-hold") return t.onHold;
      if (col.id === "done") return t.done;
    }
    return col.title;
  };

  // Helper: default board description per language
  const boardDescription =
    currentBoard?.id === "default-board"
      ? t.defaultTaskBoard
      : currentBoard?.description || "";

  // Gate app with login/register/forgot password
  if (!currentUser) {
    if (authView === "login") {
      return (
        <Login 
          onLogin={handleLogin} 
          onADLogin={handleADLogin}
          onShowRegister={() => setAuthView("register")}
          onShowForgotPassword={() => setAuthView("forgot")}
          onShowTenantRegister={() => setAuthView("tenant-register")}
        />
      );
    } else if (authView === "register") {
      return (
        <Register 
          onRegister={handleRegister} 
          onShowLogin={() => setAuthView("login")} 
        />
      );
    } else if (authView === "forgot") {
      return (
        <ForgotPassword
          onForgotPassword={handleForgotPassword}
          onBackToLogin={() => setAuthView("login")}
        />
      );
    } else if (authView === "tenant-register") {
      return (
        <TenantRegister
          onRegisterSuccess={(_tenantId, _tenantName) => {
            setAuthView("login");
          }}
          onShowLogin={() => setAuthView("login")}
        />
      );
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <Logo size="sm" variant="logo-only" />
              <span className="font-bold text-base" style={{color: 'var(--text-primary)'}}>ToDoOS</span>
            </div>
            <button className="btn-ghost p-1 lg:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{language === 'ar' ? 'رئيسي' : 'Main'}</div>
          
          {hasPermission("view_dashboard") && (
            <button className={`sidebar-item ${view === "dashboard" ? "active" : ""}`} onClick={() => { setView("dashboard"); setSidebarOpen(false); }}>
              <span className="sidebar-icon">📊</span>
              {language === 'en' ? 'Dashboard' : 'لوحة المهام'}
            </button>
          )}
          {hasPermission("view_board") && (
            <button className={`sidebar-item ${view === "board" ? "active" : ""}`} onClick={() => { setView("board"); setSidebarOpen(false); }}>
              <span className="sidebar-icon">📋</span>
              {language === 'en' ? 'Board' : 'اللوحة'}
            </button>
          )}
          <button className={`sidebar-item ${view === "calendar" ? "active" : ""}`} onClick={() => { setView("calendar"); setSidebarOpen(false); }}>
            <span className="sidebar-icon">📅</span>
            {language === 'en' ? 'Calendar' : 'التقويم'}
          </button>
          <button className={`sidebar-item ${view === "chat" ? "active" : ""}`} onClick={() => { setView("chat"); setSidebarOpen(false); }} onDoubleClick={clearAllUnreadMessages}>
            <span className="sidebar-icon relative">
              💬
              {getTotalUnreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{getTotalUnreadCount()}</span>
              )}
            </span>
            {language === 'en' ? 'Chat' : 'المحادثة'}
          </button>

          <div className="sidebar-nav-label" style={{marginTop: 12}}>{language === 'ar' ? 'تحليلات' : 'Analytics'}</div>
          <button className={`sidebar-item ${view === "reports" ? "active" : ""}`} onClick={() => { setView("reports"); setSidebarOpen(false); }}>
            <span className="sidebar-icon">📈</span>
            {language === 'en' ? 'Reports' : 'التقارير'}
          </button>
          <button className={`sidebar-item ${view === "timeline" ? "active" : ""}`} onClick={() => { setView("timeline"); setSidebarOpen(false); }}>
            <span className="sidebar-icon">📊</span>
            {language === 'en' ? 'Timeline' : 'الخط الزمني'}
          </button>

          <div className="sidebar-nav-label" style={{marginTop: 12}}>{language === 'ar' ? 'إعدادات' : 'Settings'}</div>
          {hasPermission("view_control_panel") && (
            <button className={`sidebar-item ${view === "control" ? "active" : ""}`} onClick={() => { setView("control"); setSidebarOpen(false); }}>
              <span className="sidebar-icon">👥</span>
              {language === 'en' ? 'Team' : 'الفريق'}
            </button>
          )}
          <button className={`sidebar-item ${view === "integrations" ? "active" : ""}`} onClick={() => { setView("integrations"); setSidebarOpen(false); }}>
            <span className="sidebar-icon">🔌</span>
            {language === 'en' ? 'Integrations' : 'التكاملات'}
          </button>
          <button className={`sidebar-item ${view === "workflows" ? "active" : ""}`} onClick={() => { setView("workflows"); setSidebarOpen(false); }}>
            <span className="sidebar-icon">🔄</span>
            {language === 'en' ? 'Workflows' : 'سير العمل'}
          </button>
          {currentUser?.role === "admin" && (
            <button className={`sidebar-item ${view === "subscription" ? "active" : ""}`} onClick={() => { setView("subscription"); setSidebarOpen(false); }}>
              <span className="sidebar-icon">💳</span>
              {language === 'en' ? 'Subscription' : 'الاشتراك'}
            </button>
          )}
          {currentUser?.role === "admin" && (
            <button className={`sidebar-item ${view === "settings" ? "active" : ""}`} onClick={() => { setView("settings"); setSidebarOpen(false); }}>
              <span className="sidebar-icon">⚙️</span>
              {language === 'en' ? 'System' : 'النظام'}
            </button>
          )}

          {/* Boards in sidebar */}
          <div className="sidebar-nav-label" style={{marginTop: 12}}>{language === 'ar' ? 'اللوحات' : 'Boards'}</div>
          {boards.filter(b => !b.isArchived).slice(0, 5).map(board => (
            <button
              key={board.id}
              className={`sidebar-item ${currentBoardId === board.id ? 'active' : ''}`}
              onClick={() => { handleSelectBoard(board.id); setView("board"); setSidebarOpen(false); }}
            >
              <span className="sidebar-icon" style={{fontSize: 10}}>⬤</span>
              <span className="truncate">{board.title}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{color: 'var(--text-primary)'}}>{currentUser?.name}</p>
              <p className="text-xs truncate" style={{color: 'var(--text-tertiary)'}}>{currentUser?.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <NotificationSystem
                currentUser={currentUser!}
                columns={columns}
                users={users}
                chats={chats}
                onClearChatNotifications={() => {}}
              />
            </div>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => currentUser && setPasswordChangeModal({ isOpen: true, user: currentUser })}
              className="sidebar-item text-xs justify-center flex-1"
            >
              {t.changePassword}
            </button>
            <button onClick={handleLogout} className="sidebar-item text-xs justify-center flex-1">
              {t.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border-light sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-1 text-xl">☰</button>
          <span className="font-bold text-sm" style={{color: 'var(--text-primary)'}}>ToDoOS</span>
          <DataStorageIndicator />
        </div>

        <TrialBanner />

        {/* Views */}
        {view === "board" && (
            <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fadeIn">
            {/* Board Header - Modern Card */}
            <div className="card p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'}}>
                    <span className="text-xl sm:text-2xl">📋</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{color: 'var(--text-primary)'}}>{t.tasks}</h1>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--text-tertiary)'}}>{boardDescription || t.tasks}</p>
                  </div>
                </div>
                
                <div className={`w-full sm:w-auto ${language === 'ar' ? 'sm:order-first' : 'sm:order-last'}`}>
                  <SearchAndFilter
                    columns={getFilteredColumns()}
                    users={users}
                    onFilteredResults={handleFilteredResults}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>

              {currentUser && (
                <BoardManager
                  boards={boards}
                  currentBoard={currentBoard}
                  currentUser={currentUser}
                  onCreateBoard={handleCreateBoard}
                  onSelectBoard={handleSelectBoard}
                  onDeleteBoard={handleDeleteBoard}
                  onArchiveBoard={handleArchiveBoard}
                  onUnarchiveBoard={handleUnarchiveBoard}
                  onStarBoard={handleStarBoard}
                />
              )}
              {currentBoard && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light">
                  <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'تصدير:' : 'Export:'}</span>
                  <button onClick={() => handleExportBoard("json")} className="chip hover:bg-border-light cursor-pointer">JSON</button>
                  <button onClick={() => handleExportBoard("csv")} className="chip hover:bg-border-light cursor-pointer">CSV</button>
                </div>
              )}
            </div>

            {/* Board Content: Sidebar + Columns */}
            <div className={`flex gap-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {/* Column Management Sidebar */}
              {hasPermission("manage_board") && (
                <>
                  {/* Desktop sidebar */}
                  <div className="hidden lg:block w-[260px] flex-shrink-0">
                    <div className="card p-4">
                      <ColumnManager
                        columns={columns}
                        onAddColumn={handleAddColumn}
                        onUpdateColumn={handleUpdateColumn}
                        onDeleteColumn={handleDeleteColumn}
                        hasPermission={hasPermission("manage_board")}
                      />
                    </div>
                  </div>
                  {/* Mobile toggle button */}
                  <button
                    onClick={() => setShowColumnsManager(!showColumnsManager)}
                    className="lg:hidden fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{background: 'var(--primary)', color: '#fff'}}
                  >
                    <span className="text-xl">{showColumnsManager ? '✕' : '⚙'}</span>
                  </button>
                  {/* Mobile ColumnManager overlay */}
                  {showColumnsManager && (
                    <div className="lg:hidden fixed inset-0 z-20" onClick={() => setShowColumnsManager(false)}>
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl" style={{background: 'var(--bg-card)'}} onClick={e => e.stopPropagation()}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm" style={{color: 'var(--text-primary)'}}>{language === 'ar' ? 'إدارة الأعمدة' : 'Column Manager'}</span>
                            <button onClick={() => setShowColumnsManager(false)} className="btn-ghost p-1">✕</button>
                          </div>
                          <ColumnManager
                            columns={columns}
                            onAddColumn={handleAddColumn}
                            onUpdateColumn={handleUpdateColumn}
                            onDeleteColumn={handleDeleteColumn}
                            hasPermission={hasPermission("manage_board")}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Columns Grid */}
              <div className="flex-1 min-w-0">
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {getDisplayColumns().map((col, colIndex) => (
                      <Droppable droppableId={col.id} key={col.id}>
                        {(provided, snapshot) => (
                          <div
                            className={`kanban-column flex flex-col ${
                              snapshot.isDraggingOver ? 'ring-2 ring-primary ring-opacity-40' : ''
                            }`}
                          >
                            {/* Column Header */}
                            <div className="kanban-column-header flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  colIndex === 0 ? 'priority-high' : 
                                  colIndex === 1 ? 'priority-medium' : 
                                  colIndex === 2 ? 'bg-accent-coral' :
                                  'priority-low'
                                }`}></div>
                                <h2 className="font-semibold text-sm">{getColumnTitle(col)}</h2>
                              </div>
                              <span className="badge badge-primary">{col.cards.length}</span>
                            </div>

                            {/* Scrollable Cards Area */}
                            <div 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="flex-1 overflow-y-auto px-3 pb-3 space-y-2"
                              style={{ maxHeight: 'calc(100% - 100px)' }}
                            >
                              {col.cards.map((card, index) => {
                                const completed = card.subtasks.filter((s) => s.done).length;
                                const total = card.subtasks.length;
                                const progress =
                                  total === 0 ? 0 : Math.round((completed / total) * 100);

                                return (
                                  <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => openCard(card)}
                                        className={`task-card ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105' : ''}`}
                                      >
                                        <div className={`priority-indicator ${card.priority === "High" ? 'priority-high' : card.priority === "Medium" ? 'priority-medium' : 'priority-low'}`} />
                                        <div>
                                          {/* Title */}
                                          <div className="font-medium text-sm mb-2" style={{color: 'var(--text-primary)'}}>{card.title}</div>

                                          {/* Priority and Due Date */}
                                          <div className="flex items-center justify-between mb-2">
                                            {card.priority && (
                                              <span className={`chip ${
                                                card.priority === "High" ? 'badge-error' : 
                                                card.priority === "Medium" ? 'badge-warning' : 
                                                'badge-success'
                                              }`}>
                                                {card.priority === "High" ? (language === 'ar' ? "عالية" : "High") : 
                                                 card.priority === "Medium" ? (language === 'ar' ? "متوسطة" : "Medium") : 
                                                 (language === 'ar' ? "منخفضة" : "Low")}
                                              </span>
                                            )}
                                            {card.dueDate && (
                                              <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>📅 {card.dueDate}</span>
                                            )}
                                          </div>

                                          {/* Members - compact */}
                                          {card.members.length > 0 && (
                                            <div className="flex items-center gap-1 mb-2">
                                              {card.members.slice(0, 3).map((m) => (
                                                <span key={m.id} title={m.name} className="text-sm">{m.avatar || "👤"}</span>
                                              ))}
                                              {card.members.length > 3 && (
                                                <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>+{card.members.length - 3}</span>
                                              )}
                                            </div>
                                          )}

                                          {/* Progress Bar */}
                                          {total > 0 && (
                                            <div className="mb-1">
                                              <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                                              </div>
                                              <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>
                                                {completed}/{total} ({progress}%)
                                              </p>
                                            </div>
                                          )}

                                          {/* Attachments */}
                                          {card.attachments.length > 0 && (
                                            <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>📎 {card.attachments.length}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>

                            {/* Add Task Button */}
                            <div className="px-3 pb-3 pt-0 flex-shrink-0">
                              {hasPermission("create_task") && (
                                <button
                                  className="btn-primary w-full flex items-center justify-center gap-2"
                                  onClick={() => setIsAddModalOpen(col.id)}
                                >
                                  <span>+</span>
                                  {t.addTask}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              </div>
            </div>

            {selectedCard && currentUser && (
              <CardModal
                card={selectedCard}
                onClose={closeCard}
                onUpdate={updateCard}
                onDelete={deleteCard}
                availableMembers={users.map(u => ({
                  id: u.id,
                  name: u.name,
                  avatar: u.avatar || "👤"
                }))}
                currentUser={currentUser}
                assignRequests={assignRequests}
                onRequestAssign={handleRequestAssign}
                onApproveAssign={handleApproveAssign}
                onRejectAssign={handleRejectAssign}
              />
            )}

            {isAddModalOpen && (
              <AddTaskModal
                isOpen={!!isAddModalOpen}
                onClose={() => setIsAddModalOpen(null)}
                onAdd={(card) => {
                  addCard(isAddModalOpen, card);
                  setIsAddModalOpen(null);
                }}
                availableMembers={users.map(u => ({
                  id: u.id,
                  name: u.name,
                  avatar: u.avatar || "👤"
                }))}
              />
            )}
          </div>
        )}

        {view === "dashboard" && (
          <Dashboard
            columns={columns}
            currentUser={currentUser}
            availableMembers={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar || "👤" }))}
            onAddCard={addCard}
            onOpenCard={openCard}
          />
        )}

        {view === "control" && currentUser && (
          <div className="p-4 md:p-6 animate-slideInFromLeft">
            <ControlPanel 
              currentUser={currentUser}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        )}

        {view === "chat" && currentUser && (
          <div className="p-4 md:p-6 animate-slideInFromBottom">
            <ChatPage
              currentUser={currentUser}
              users={users}
              chats={chats}
              onSendMessage={handleSendMessage}
              onCreateChat={handleCreateChat}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        )}

        {view === "calendar" && currentUser && (
          <div className="p-4 md:p-6 animate-zoomIn">
            <CalendarView
              columns={columns}
              currentUser={currentUser}
              onCardClick={openCard}
            />
          </div>
        )}

        {view === "reports" && (
          <div className="p-4 md:p-6 animate-slideInFromTop">
            <AdvancedReports boards={boards} />
          </div>
        )}

        {view === "integrations" && (
          <div className="p-4 md:p-6 animate-slideInFromRight">
            <Integrations />
          </div>
        )}

        {view === "workflows" && (
          <div className="p-4 md:p-6 animate-slideInFromLeft">
            <Workflows />
          </div>
        )}

        {view === "timeline" && (
          <div className="p-4 md:p-6 animate-zoomIn">
            <Timeline boards={boards} />
          </div>
        )}

        {view === "subscription" && currentUser?.role === "admin" && (
          <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-4 sm:p-6 animate-slideInFromBottom">
            <h1 className="text-2xl font-bold mb-6">{language === 'ar' ? 'الاشتراك' : 'Subscription'}</h1>
            <p className="text-gray-600 mb-6">{language === 'ar' ? 'إدارة خطة الاشتراك والفترة التجريبية' : 'Manage subscription plan and trial period'}</p>
            <div className="max-w-4xl">
              <SubscriptionPanel />
            </div>
          </div>
        )}

        {view === "settings" && currentUser?.role === "admin" && (
          <div className="p-4 md:p-6 animate-slideInFromBottom">
            <SystemSettings />
          </div>
        )}
      </main>

      {/* Password Change Modal */}
      {passwordChangeModal.isOpen && passwordChangeModal.user && currentUser && (
        <PasswordChangeModal
          isOpen={passwordChangeModal.isOpen}
          onClose={() => setPasswordChangeModal({ isOpen: false, user: null })}
          user={passwordChangeModal.user}
          currentUser={currentUser}
          onPasswordChange={handlePasswordChange}
        />
      )}
    </div>
  );
};

export default App;
