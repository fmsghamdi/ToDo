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
      if (col.id === "on-hold") return t.onHold;
      if (col.id === "done") return t.done;
    }
    return col.title;
  };

  if (!hasPermission) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" style={{color: 'var(--text-primary)'}}>
          {language === 'ar' ? 'الأعمدة' : 'Columns'}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs px-3 py-1"
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddColumn} className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder={language === 'ar' ? 'اسم العمود' : 'Column name'}
              className="input flex-1 text-xs"
              autoFocus
            />
            <button type="submit" className="btn-primary text-xs px-3">
              {t.add}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto">
        {columns
          .sort((a, b) => a.position - b.position)
          .map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{border: '1px solid var(--border-light)', background: column.cards.length > 0 ? 'var(--bg-surface)' : 'transparent'}}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>⋮⋮</span>
                {editingColumn === column.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input text-xs flex-1 min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateColumn(column.id);
                      else if (e.key === "Escape") cancelEditing();
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="text-xs font-medium truncate">{getDisplayTitle(column)}</span>
                    <span className="text-xs flex-shrink-0" style={{color: 'var(--text-tertiary)'}}>{column.cards.length}</span>
                    {column.isDefault && (
                      <span className="chip text-[10px]" style={{background: 'var(--primary-light)', color: 'var(--primary-dark)'}}>
                        {language === 'ar' ? 'افتراضي' : 'DF'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {editingColumn === column.id ? (
                  <>
                    <button onClick={() => handleUpdateColumn(column.id)} className="text-xs" style={{color: 'var(--primary)'}}>{t.save}</button>
                    <button onClick={cancelEditing} className="text-xs" style={{color: 'var(--text-tertiary)'}}>{t.cancel}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(column)} className="text-xs" style={{color: 'var(--primary)'}}>{t.edit}</button>
                    {!column.isDefault && (
                      <button
                        onClick={() => {
                          const msg =
                            language === 'ar'
                              ? `حذف "${column.title}"؟${column.cards.length > 0 ? `\nسيتم نقل ${column.cards.length} مهمة.` : ''}`
                              : `Delete "${column.title}"?${column.cards.length > 0 ? `\n${column.cards.length} tasks will be moved.` : ''}`;
                          if (confirm(msg)) onDeleteColumn(column.id);
                        }}
                        className="text-xs" style={{color: 'var(--danger)'}}
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
    </>
  );
};

export default ColumnManager;
