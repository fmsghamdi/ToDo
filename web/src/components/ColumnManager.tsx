import React, { useState } from "react";
import type { Column } from "../Types";
import { useLanguage } from "../i18n/useLanguage";

interface ColumnManagerProps {
  columns: Column[];
  onAddColumn: (title: string) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  hasPermission: boolean;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  hasPermission,
}) => {
  const { t, language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    
    onAddColumn(newColumnTitle.trim());
    setNewColumnTitle("");
    setShowAddForm(false);
  };

  const handleUpdateColumn = (columnId: string) => {
    if (!editTitle.trim()) return;
    
    onUpdateColumn(columnId, editTitle.trim());
    setEditingColumn(null);
    setEditTitle("");
  };

  const startEditing = (column: Column) => {
    setEditingColumn(column.id);
    setEditTitle(column.title);
  };

  const cancelEditing = () => {
    setEditingColumn(null);
    setEditTitle("");
  };

  const getDisplayTitle = (col: Column) => {
    if (col.isDefault) {
      if (col.id === "todo") return t.todo;
      if (col.id === "in-progress") return t.inProgress;
      if (col.id === "done") return t.done;
    }
    return col.title;
  };

  if (!hasPermission) return null;

  return (
    <div className="mb-6 bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{language === 'ar' ? 'إدارة الأعمدة' : 'Column Management'}</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
        >
          {showAddForm ? t.cancel : `+ ${t.add} ${language === 'ar' ? 'عمود' : 'Column'}`}
        </button>
      </div>

      {/* Add Column Form */}
      {showAddForm && (
        <form onSubmit={handleAddColumn} className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex gap-2">
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder={language === 'ar' ? 'اسم العمود الجديد' : 'New column name'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {t.add}
            </button>
          </div>
        </form>
      )}

      {/* Columns List */}
      <div className="space-y-2">
        {columns
          .sort((a, b) => a.position - b.position)
          .map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400">⋮⋮</div>
                {editingColumn === column.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateColumn(column.id);
                      } else if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div>
                    <span className="font-medium">{getDisplayTitle(column)}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({column.cards.length} {language === 'ar' ? 'مهمة' : (column.cards.length === 1 ? 'task' : 'tasks')})
                    </span>
                    {column.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                        {language === 'ar' ? 'افتراضي' : 'Default'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingColumn === column.id ? (
                  <>
                    <button
                      onClick={() => handleUpdateColumn(column.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      {t.save}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      {t.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(column)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {t.edit}
                    </button>
                    {!column.isDefault && (
                      <button
                        onClick={() => {
                          const msg =
                            language === 'ar'
                              ? `هل أنت متأكد من حذف العمود "${column.title}"؟\n${
                                  column.cards.length > 0
                                    ? `سيتم نقل ${column.cards.length} مهمة إلى العمود الأول.`
                                    : ''
                                }`
                              : `Are you sure you want to delete the column "${column.title}"?\n${
                                  column.cards.length > 0
                                    ? `${column.cards.length} ${column.cards.length === 1 ? 'task' : 'tasks'} will be moved to the first column.`
                                    : ''
                                }`;
                          if (confirm(msg)) {
                            onDeleteColumn(column.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        {t.delete}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        {language === 'ar'
          ? '💡 يمكنك سحب وإفلات الأعمدة لإعادة ترتيبها. الأعمدة الافتراضية لا يمكن حذفها.'
          : '💡 You can drag and drop columns to reorder them. Default columns cannot be deleted.'}
      </div>
    </div>
  );
};

export default ColumnManager;
