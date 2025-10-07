import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import CardModal from "./CardModal";
import type { Card, Column } from "./Types";
import AddTaskModal from "./AddTaskModal";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordChangeModal from "./components/PasswordChangeModal";
import ChatPage from "./pages/Chat";
import ColumnManager from "./components/ColumnManager";
import SearchAndFilter from "./components/SearchAndFilter";
import NotificationSystem from "./components/NotificationSystem";
import CalendarView from "./pages/CalendarView";
import SystemSettings from "./pages/SystemSettings";
import BoardManager from "./components/BoardManager";
import LanguageSwitcher from "./components/LanguageSwitcher";
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
import { workflowService } from './services/WorkflowService';
import { workflowExecutionEngine } from './services/WorkflowExecutionEngine';
import { authService, type ADUser } from './services/AuthService';

type View = "board" | "dashboard" | "control" | "chat" | "calendar" | "settings" | "reports" | "integrations" | "workflows" | "timeline";

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

  const [view, setView] = useState<View>("board");
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");
  
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
        { id: "done", title: language === 'ar' ? "مكتمل" : "Done", cards: [], position: 2, isDefault: true, createdAt: Date.now() },
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

  const currentBoard = boards.find(b => b.id === currentBoardId) || boards[0];
  const columns = currentBoard?.columns || [];

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<string | null>(null);

  // Search and filter state
  const [filteredColumns, setFilteredColumns] = useState<Column[] | null>(null);

  // Chat state
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : [];
  });

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
  const handleLogin = (email: string, password: string): string | null => {
    if (!email.includes("@")) return t.invalidEmail;
    if (password.length < 4) return t.passwordTooShort;
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return t.invalidCredentials;
    
    setCurrentUserId(user.id);
    return null;
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
    handleUpdateBoard(boardId, { isArchived: true });
  };

  const handleStarBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      handleUpdateBoard(boardId, { isStarred: !board.isStarred });
    }
  };

  // Removed unused getSortedColumns function

  // Helper: derive display title for default columns based on current language
  const getColumnTitle = (col: Column) => {
    if (col.isDefault) {
      if (col.id === "todo") return t.todo;
      if (col.id === "in-progress") return t.inProgress;
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
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header / Nav */}
      <header className="header-gradient fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-green-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇸🇦</span>
              <span className="font-bold text-lg text-white">ToDoOS</span>
            </div>
            <nav className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              {hasPermission("view_board") && (
                <button
                  className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "board" 
                      ? "bg-white text-green-700 shadow-lg scale-105" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setView("board")}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">📋</span>
                    <span className="text-xs">{language === 'en' ? 'Board' : 'اللوحة'}</span>
                  </div>
                  {view === "board" && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
              {hasPermission("view_dashboard") && (
                <button
                  className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "dashboard" 
                      ? "bg-white text-green-700 shadow-lg scale-105" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setView("dashboard")}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">📊</span>
                    <span className="text-xs">{language === 'en' ? 'Dashboard' : 'الرئيسية'}</span>
                  </div>
                  {view === "dashboard" && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
              {hasPermission("view_control_panel") && (
                <button
                  className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "control" 
                      ? "bg-white text-green-700 shadow-lg scale-105" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setView("control")}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">👥</span>
                    <span className="text-xs">{language === 'en' ? 'Control Panel' : 'لوحة التحكم'}</span>
                  </div>
                  {view === "control" && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "chat" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("chat")}
                onDoubleClick={clearAllUnreadMessages}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <span className="text-lg">💬</span>
                    {getTotalUnreadCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                        {getTotalUnreadCount()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs">{language === 'en' ? 'Chat' : 'المحادثة'}</span>
                </div>
                {view === "chat" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "calendar" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("calendar")}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">📅</span>
                  <span className="text-xs">{language === 'en' ? 'Calendar' : 'التقويم'}</span>
                </div>
                {view === "calendar" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "reports" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("reports")}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">📈</span>
                  <span className="text-xs">{language === 'en' ? 'Reports' : 'التقارير'}</span>
                </div>
                {view === "reports" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "timeline" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("timeline")}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">📊</span>
                  <span className="text-xs">{language === 'en' ? 'Timeline' : 'الخط الزمني'}</span>
                </div>
                {view === "timeline" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "integrations" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("integrations")}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">🔌</span>
                  <span className="text-xs">{language === 'en' ? 'Integrations' : 'التكاملات'}</span>
                </div>
                {view === "integrations" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  view === "workflows" 
                    ? "bg-white text-green-700 shadow-lg scale-105" 
                    : "text-white hover:bg-white/20"
                }`}
                onClick={() => setView("workflows")}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">🔄</span>
                  <span className="text-xs">{language === 'en' ? 'Workflows' : 'سير العمل'}</span>
                </div>
                {view === "workflows" && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                )}
              </button>
              {currentUser?.role === "admin" && (
                <button
                  className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "settings" 
                      ? "bg-white text-green-700 shadow-lg scale-105" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setView("settings")}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">⚙️</span>
                    <span className="text-xs">{language === 'en' ? 'System Settings' : 'إعدادات النظام'}</span>
                  </div>
                  {view === "settings" && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-green-700 rounded-full animate-pulse"></div>
                  )}
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <NotificationSystem
                currentUser={currentUser}
                columns={columns}
                users={users}
                chats={chats}
                onClearChatNotifications={(chatId) => {
                  // This function will be called when chat notifications are cleared
                  console.log(`Clearing notifications for chat: ${chatId}`);
                }}
              />
            )}
            {/* Connection Status Indicator */}
            <DataStorageIndicator />
            <div className="relative group">
              <span className="text-sm text-white cursor-pointer font-medium">{t.welcome}، {currentUser?.name}</span>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={() => currentUser && setPasswordChangeModal({ isOpen: true, user: currentUser })}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                >
                  {t.changePassword}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Beautiful Language Switcher */}
      <LanguageSwitcher />

      {/* Views */}
      <main className="min-h-screen pt-20 transition-all duration-500" style={{
        background: 'linear-gradient(135deg, var(--saudi-cream) 0%, var(--gray-50) 50%, var(--saudi-beige) 100%)'
      }}>
        {view === "board" && (
          <div className="max-w-7xl mx-auto p-6 animate-fadeIn">
            {/* Header Section with improved styling */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t.tasks}</h1>
                    <p className="text-gray-500 text-sm">{boardDescription || t.tasks}</p>
                  </div>
                </div>
                
                {/* Search and Filter - positioned based on language direction */}
                <div className={`${language === 'ar' ? 'order-first' : 'order-last'}`}>
                  <SearchAndFilter
                    columns={getFilteredColumns()}
                    users={users}
                    onFilteredResults={handleFilteredResults}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>

              {/* Board Management */}
              {currentUser && (
                <BoardManager
                  boards={boards}
                  currentBoard={currentBoard}
                  currentUser={currentUser}
                  onCreateBoard={handleCreateBoard}
                  onSelectBoard={handleSelectBoard}
                  onDeleteBoard={handleDeleteBoard}
                  onArchiveBoard={handleArchiveBoard}
                  onStarBoard={handleStarBoard}
                />
              )}
            </div>

            {/* Columns Section */}
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-3 gap-6 pb-6">
                {getDisplayColumns().map((col, colIndex) => (
                  <Droppable droppableId={col.id} key={col.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 h-96 flex flex-col ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300 shadow-md' : ''
                        }`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              colIndex === 0 ? 'bg-red-400' : 
                              colIndex === 1 ? 'bg-yellow-400' : 
                              'bg-green-400'
                            }`}></div>
                            <h2 className="font-semibold text-sm text-gray-800">{getColumnTitle(col)}</h2>
                          </div>
                          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                            {col.cards.length}
                          </div>
                        </div>

                        {/* Scrollable Cards Area */}
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="flex-1 overflow-y-auto px-4 pb-4 space-y-2"
                          style={{ maxHeight: 'calc(100% - 120px)' }}
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
                                    className={`bg-white p-3 mb-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
                                      snapshot.isDragging ? 'shadow-lg rotate-1 scale-105 border-blue-300' : ''
                                    }`}
                                  >
                                    <div>
                                      {/* Title */}
                                      <div className="font-medium text-sm text-gray-900 mb-2">{card.title}</div>

                                      {/* Priority and Due Date in one line */}
                                      <div className="flex items-center justify-between mb-2">
                                        {card.priority && (
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                                              card.priority === "High"
                                                ? "bg-red-500"
                                                : card.priority === "Medium"
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                            }`}
                                          >
                                            {card.priority === "High" ? (language === 'ar' ? "عالية" : "High") : 
                                             card.priority === "Medium" ? (language === 'ar' ? "متوسطة" : "Medium") : 
                                             (language === 'ar' ? "منخفضة" : "Low")}
                                          </span>
                                        )}
                                        {card.dueDate && (
                                          <div className="text-xs text-gray-500">
                                            📅 {card.dueDate}
                                          </div>
                                        )}
                                      </div>

                                      {/* Members - compact */}
                                      {card.members.length > 0 && (
                                        <div className="flex items-center gap-1 mb-2">
                                          {card.members.slice(0, 2).map((m) => (
                                            <span key={m.id} title={m.name} className="text-sm">
                                              {m.avatar || "👤"}
                                            </span>
                                          ))}
                                          {card.members.length > 2 && (
                                            <span className="text-xs text-gray-500">+{card.members.length - 2}</span>
                                          )}
                                        </div>
                                      )}

                                      {/* Progress Bar - compact */}
                                      {total > 0 && (
                                        <div className="mb-2">
                                          <div className="w-full bg-gray-200 rounded h-1">
                                            <div
                                              className="bg-green-500 h-1 rounded"
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {completed}/{total} ({progress}%)
                                          </p>
                                        </div>
                                      )}

                                      {/* Attachments - compact */}
                                      {card.attachments.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                          📎 {card.attachments.length}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>

                        {/* Add Task Button - Fixed at bottom */}
                        <div className="p-4 pt-0 flex-shrink-0">
                          {hasPermission("create_task") && (
                            <button
                              className="btn-primary w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 fade-in"
                              onClick={() => setIsAddModalOpen(col.id)}
                            >
                              <span className="text-lg">+</span>
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

            {/* Column Management - Below columns */}
            <div className="mt-6">
              <ColumnManager
                columns={columns}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                hasPermission={hasPermission("manage_board")}
              />
            </div>

            {selectedCard && (
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
          <div className="p-6 animate-slideInFromRight">
            <Dashboard columns={columns} />
          </div>
        )}

        {view === "control" && currentUser && (
          <div className="p-6 animate-slideInFromLeft">
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
          <div className="p-6 animate-slideInFromBottom">
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
          <div className="p-6 animate-zoomIn">
            <CalendarView
              columns={columns}
              currentUser={currentUser}
              onCardClick={openCard}
            />
          </div>
        )}

        {view === "reports" && (
          <div className="p-6 animate-slideInFromTop">
            <AdvancedReports boards={boards} />
          </div>
        )}

        {view === "integrations" && (
          <div className="p-6 animate-slideInFromRight">
            <Integrations />
          </div>
        )}

        {view === "workflows" && (
          <div className="p-6 animate-slideInFromLeft">
            <Workflows />
          </div>
        )}

        {view === "timeline" && (
          <div className="p-6 animate-zoomIn">
            <Timeline boards={boards} />
          </div>
        )}

        {view === "settings" && currentUser?.role === "admin" && (
          <div className="p-6 animate-slideInFromBottom">
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
