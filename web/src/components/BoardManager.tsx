import React, { useState } from "react";
import type { Board } from "../Types";
import type { User } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

interface BoardManagerProps {
  boards: Board[];
  currentBoard: Board | undefined;
  currentUser: User;
  onCreateBoard: (boardData: Omit<Board, "id" | "createdAt" | "updatedAt">) => void;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onArchiveBoard: (boardId: string) => void;
  onStarBoard: (boardId: string) => void;
}

const BoardManager: React.FC<BoardManagerProps> = ({
  boards,
  currentBoard,
  currentUser,
  onCreateBoard,
  onSelectBoard,
  onDeleteBoard,
  onArchiveBoard,
  onStarBoard,
}) => {
  const { t, language } = useLanguage();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardData, setNewBoardData] = useState({
    title: "",
    description: "",
    background: "#3b82f6",
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardData.title.trim()) return;

    onCreateBoard({
      title: newBoardData.title.trim(),
      description: newBoardData.description.trim(),
      background: newBoardData.background,
      columns: [
        { 
          id: "todo", 
          title: t.todo || "To Do", 
          cards: [], 
          position: 0, 
          isDefault: true, 
          createdAt: Date.now() 
        },
        { 
          id: "in-progress", 
          title: t.inProgress || "In Progress", 
          cards: [], 
          position: 1, 
          isDefault: true, 
          createdAt: Date.now() 
        },
        { 
          id: "done", 
          title: t.done || "Done", 
          cards: [], 
          position: 2, 
          isDefault: true, 
          createdAt: Date.now() 
        },
      ],
      members: [
        {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || "👤",
        }
      ],
      isArchived: false,
      isStarred: false,
      createdBy: currentUser.id,
    });

    setNewBoardData({
      title: "",
      description: "",
      background: "#3b82f6",
    });
    setShowCreateForm(false);
  };

  const backgroundColors = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
  ];

  // Localized board title for default board
  const getBoardTitle = (board: Board) =>
    board.id === "default-board" ? (language === "ar" ? "اللوحة الرئيسية" : "Main Board") : board.title;

  // Filter out archived boards for main display
  const activeBoards = boards.filter(board => !board.isArchived);
  const starredBoards = activeBoards.filter(board => board.isStarred);

  return (
    <div className="space-y-4">
      {/* Current Board Info */}
      {currentBoard && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: currentBoard.background }}
            ></div>
            <div>
              <h2 className="font-semibold text-lg">{getBoardTitle(currentBoard)}</h2>
              {currentBoard.description && (
                <p className="text-sm text-gray-600">{currentBoard.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStarBoard(currentBoard.id)}
              className={`p-1 rounded ${
                currentBoard.isStarred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
              }`}
              title={currentBoard.isStarred ? (language === "ar" ? "إلغاء التمييز" : "Unstar") : (language === "ar" ? "تمييز" : "Star")}
            >
              ⭐
            </button>
            
            {currentUser.role === "admin" && (
              <>
                <button
                  onClick={() => onArchiveBoard(currentBoard.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title={language === "ar" ? "أرشفة" : "Archive"}
                >
                  📦
                </button>
                
                {boards.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(language === "ar" ? `هل أنت متأكد من حذف اللوحة "${currentBoard.title}"؟` : `Are you sure you want to delete board "${currentBoard.title}"?`)) {
                        onDeleteBoard(currentBoard.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                    title={t.delete}
                  >
                    🗑️
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Board Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Starred Boards */}
        {starredBoards.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language === "ar" ? "⭐ مميزة:" : "⭐ Starred:"}</span>
            {starredBoards.map(board => (
              <button
                key={board.id}
                onClick={() => onSelectBoard(board.id)}
                className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                  currentBoard?.id === board.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div 
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: board.background }}
                ></div>
                {getBoardTitle(board)}
              </button>
            ))}
          </div>
        )}

        {/* All Boards Dropdown */}
        <select
          value={currentBoard?.id || ""}
          onChange={(e) => onSelectBoard(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          {activeBoards.map(board => (
            <option key={board.id} value={board.id}>
              {board.isStarred ? "⭐ " : ""}{getBoardTitle(board)}
            </option>
          ))}
        </select>

        {/* Create New Board */}
        {currentUser.role === "admin" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            {showCreateForm ? t.cancel : (language === "ar" ? "+ لوحة جديدة" : "+ New Board")}
          </button>
        )}
      </div>

      {/* Create Board Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateBoard} className="bg-gray-50 p-4 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{language === "ar" ? "اسم اللوحة" : "Board Name"}</label>
            <input
              type="text"
              value={newBoardData.title}
              onChange={(e) => setNewBoardData({ ...newBoardData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === "ar" ? "مثال: مشروع التطوير" : "e.g., Development Project"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{language === "ar" ? "الوصف (اختياري)" : "Description (optional)"}</label>
            <textarea
              value={newBoardData.description}
              onChange={(e) => setNewBoardData({ ...newBoardData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === "ar" ? "وصف مختصر للوحة..." : "Short description for the board..."}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{language === "ar" ? "لون الخلفية" : "Background color"}</label>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewBoardData({ ...newBoardData, background: color })}
                  className={`w-8 h-8 rounded border-2 ${
                    newBoardData.background === color ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {language === "ar" ? "إنشاء اللوحة" : "Create Board"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Board Stats */}
      {currentBoard && (
        <div className="text-xs text-gray-500 flex gap-4">
          <span>📊 {currentBoard.columns.reduce((sum, col) => sum + col.cards.length, 0)} {language === "ar" ? "مهمة" : "tasks"}</span>
          <span>👥 {currentBoard.members.length} {language === "ar" ? "عضو" : "members"}</span>
          <span>📅 {language === "ar" ? `تم الإنشاء: ${new Date(currentBoard.createdAt).toLocaleDateString("ar-SA")}` : `Created: ${new Date(currentBoard.createdAt).toLocaleDateString("en-US")}`}</span>
        </div>
      )}
    </div>
  );
};

export default BoardManager;
