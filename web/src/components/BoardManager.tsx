import React, { useState } from "react";
import type { Board, Column } from "../Types";
import { BOARD_TEMPLATES } from "../Types";
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
  onUnarchiveBoard: (boardId: string) => void;
  onStarBoard: (boardId: string) => void;
}

interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  columns: { title: string; position: number }[];
  background?: string;
}

const loadUserTemplates = (): SavedTemplate[] => {
  try {
    const saved = localStorage.getItem("boardTemplates");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveUserTemplates = (templates: SavedTemplate[]) => {
  localStorage.setItem("boardTemplates", JSON.stringify(templates));
};

const BoardManager: React.FC<BoardManagerProps> = ({
  boards,
  currentBoard,
  currentUser,
  onCreateBoard,
  onSelectBoard,
  onDeleteBoard,
  onArchiveBoard,
  onUnarchiveBoard,
  onStarBoard,
}) => {
  const { t, language } = useLanguage();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [userTemplates, setUserTemplates] = useState<SavedTemplate[]>(loadUserTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newBoardData, setNewBoardData] = useState({
    title: "",
    description: "",
    background: "#3b82f6",
  });

  const getAllTemplates = () => {
    const staticTemplates = BOARD_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      columns: t.columns,
    }));
    return [...staticTemplates, ...userTemplates];
  };

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardData.title.trim()) return;

    const template = getAllTemplates().find(t => t.id === selectedTemplateId);
    const defaultColumns = template
      ? template.columns.map((col, i) => ({
          id: `col-${Date.now()}-${i}`,
          title: col.title,
          cards: [],
          position: col.position,
          createdAt: Date.now(),
        }))
      : [
          { id: "todo", title: t.todo || "To Do", cards: [], position: 0, isDefault: true, createdAt: Date.now() },
          { id: "in-progress", title: t.inProgress || "In Progress", cards: [], position: 1, isDefault: true, createdAt: Date.now() },
          { id: "on-hold", title: t.onHold || "On Hold", cards: [], position: 2, isDefault: true, createdAt: Date.now() },
          { id: "done", title: t.done || "Done", cards: [], position: 3, isDefault: true, createdAt: Date.now() },
        ];

    onCreateBoard({
      title: newBoardData.title.trim(),
      description: newBoardData.description.trim(),
      background: newBoardData.background,
      columns: defaultColumns as Column[],
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

    setNewBoardData({ title: "", description: "", background: "#3b82f6" });
    setSelectedTemplateId("");
    setShowCreateForm(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !currentBoard) return;
    const newTemplate: SavedTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      description: currentBoard.description || "",
      columns: currentBoard.columns.map((col, i) => ({
        title: col.title,
        position: i,
      })),
      background: currentBoard.background,
    };
    const updated = [...userTemplates, newTemplate];
    setUserTemplates(updated);
    saveUserTemplates(updated);
    setTemplateName("");
    setShowSaveTemplate(false);
  };

  const backgroundColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
  ];

  const getBoardTitle = (board: Board) =>
    board.id === "default-board" ? (language === "ar" ? "اللوحة الرئيسية" : "Main Board") : board.title;

  const activeBoards = boards.filter(board => !board.isArchived);
  const archivedBoards = boards.filter(board => board.isArchived);
  const starredBoards = activeBoards.filter(board => board.isStarred);

  return (
    <div className="space-y-4">
      {currentBoard && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: currentBoard.background }}></div>
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
            >⭐</button>

            {currentUser.role === "admin" && (
              <>
                <button
                  onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                  className="text-purple-400 hover:text-purple-600 p-1 rounded"
                  title={language === "ar" ? "حفظ كقالب" : "Save as Template"}
                >📋</button>

                <button
                  onClick={() => onArchiveBoard(currentBoard.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title={language === "ar" ? "أرشفة" : "Archive"}
                >📦</button>

                {boards.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(language === "ar" ? `هل أنت متأكد من حذف اللوحة "${currentBoard.title}"؟` : `Are you sure you want to delete board "${currentBoard.title}"?`)) {
                        onDeleteBoard(currentBoard.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                    title={t.delete}
                  >🗑️</button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showSaveTemplate && (
        <div className="bg-purple-50 p-3 rounded flex items-center gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={language === "ar" ? "اسم القالب" : "Template name"}
            className="flex-1 px-3 py-1.5 border rounded text-sm"
          />
          <button
            onClick={handleSaveTemplate}
            className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >{language === "ar" ? "حفظ" : "Save"}</button>
          <button
            onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
            className="px-3 py-1.5 bg-gray-300 rounded text-sm"
          >{t.cancel}</button>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {starredBoards.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language === "ar" ? "⭐ مميزة:" : "⭐ Starred:"}</span>
            {starredBoards.map(board => (
              <button
                key={board.id}
                onClick={() => onSelectBoard(board.id)}
                className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                  currentBoard?.id === board.id ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="w-2 h-2 rounded" style={{ backgroundColor: board.background }}></div>
                {getBoardTitle(board)}
              </button>
            ))}
          </div>
        )}

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

        {currentUser.role === "admin" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            {showCreateForm ? t.cancel : (language === "ar" ? "+ لوحة جديدة" : "+ New Board")}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateBoard} className="bg-gray-50 p-4 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{language === "ar" ? "قالب اللوحة" : "Board Template"}</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                const template = getAllTemplates().find(t => t.id === e.target.value);
                if (template) {
                  setNewBoardData(prev => ({
                    ...prev,
                    description: template.description,
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">{language === "ar" ? "— قالب افتراضي —" : "— Default Template —"}</option>
              {getAllTemplates().map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

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
                  className={`w-8 h-8 rounded border-2 ${newBoardData.background === color ? "border-gray-800" : "border-gray-300"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {language === "ar" ? "إنشاء اللوحة" : "Create Board"}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {archivedBoards.length > 0 && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>{showArchived ? "▼" : "▶"}</span>
            <span>{language === "ar" ? `اللوحات المؤرشفة (${archivedBoards.length})` : `Archived Boards (${archivedBoards.length})`}</span>
          </button>
          {showArchived && (
            <div className="mt-2 space-y-2">
              {archivedBoards.map(board => (
                <div key={board.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: board.background }}></div>
                    <span className="text-sm text-gray-600">{getBoardTitle(board)}</span>
                  </div>
                  <button
                    onClick={() => onUnarchiveBoard(board.id)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {language === "ar" ? "إلغاء الأرشفة" : "Unarchive"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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