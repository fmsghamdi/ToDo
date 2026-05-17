import React, { useState } from "react";
import type { Column, Card, Member } from "../Types";
import { useLanguage } from "../i18n/useLanguage";
import type { User } from "../UserTypes";

type Props = {
  columns: Column[];
  currentUser?: User | null;
  availableMembers: Member[];
  onAddCard: (columnId: string, card: Card) => void;
  onOpenCard: (card: Card) => void;
};

export default function Dashboard({ columns, currentUser, availableMembers, onAddCard, onOpenCard }: Props) {
  const { t, language } = useLanguage();
  const [quickTitle, setQuickTitle] = useState("");

  const allCards = columns.flatMap((c) => c.cards);
  const totalCards = allCards.length;

  const doneColumn = columns.find((c) => c.id === "done");
  const doneCards = doneColumn ? doneColumn.cards.length : 0;

  const inProgressColumn = columns.find((c) => c.id === "in-progress");
  const inProgressCards = inProgressColumn ? inProgressColumn.cards.length : 0;

  const today = new Date().toISOString().split("T")[0];
  const todayCards = allCards.filter((c) => c.dueDate === today);
  const overdueCards = allCards.filter((c) => c.dueDate && c.dueDate < today);
  const highPriorityCards = allCards.filter((c) => c.priority === "High");

  const totalSubtasks = allCards.reduce((sum, card) => sum + card.subtasks.length, 0);
  const doneSubtasks = allCards.reduce((sum, card) => sum + card.subtasks.filter((s) => s.done).length, 0);
  const subtaskProgress = totalSubtasks === 0 ? 0 : Math.round((doneSubtasks / totalSubtasks) * 100);

  // Get all activity from all cards, sorted by time
  const allActivity = allCards
    .flatMap((card) => card.activity.map((a) => ({ ...a, cardTitle: card.title, cardId: card.id })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  // Get upcoming deadlines (future dates)
  const upcomingCards = allCards
    .filter((c) => c.dueDate && c.dueDate > today)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 5);

  // Time-based greeting
  const hour = new Date().getHours();
  let greeting = language === 'ar' ? 'مرحباً' : 'Hello';
  if (hour < 12) greeting = language === 'ar' ? 'صباح الخير' : 'Good morning';
  else if (hour < 17) greeting = language === 'ar' ? 'مساء الخير' : 'Good afternoon';
  else greeting = language === 'ar' ? 'مساء الخير' : 'Good evening';

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const todoCol = columns.find((c) => c.id === "todo");
    if (!todoCol) return;
    const newCard: Card = {
      id: Date.now().toString(),
      title: quickTitle.trim(),
      description: "",
      subtasks: [],
      labels: [],
      members: [],
      attachments: [],
      comments: [],
      activity: [{
        id: Date.now().toString(),
        type: "created",
        message: `Task "${quickTitle.trim()}" created`,
        at: Date.now(),
      }],
      timeEntries: [],
    };
    onAddCard(todoCol.id, newCard);
    setQuickTitle("");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="welcome-card">
        <h2>{greeting}{currentUser ? `, ${currentUser.name}` : ''} 👋</h2>
        <p>{language === 'ar' ? `لديك ${todayCards.length} مهام اليوم و ${overdueCards.length} مهام متأخرة` : `You have ${todayCards.length} tasks today and ${overdueCards.length} overdue`}</p>
        <div className="welcome-stats">
          <div className="welcome-stat">
            <div className="welcome-stat-value">{totalCards}</div>
            <div className="welcome-stat-label">{language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat-value">{doneCards}</div>
            <div className="welcome-stat-label">{language === 'ar' ? 'مكتملة' : 'Completed'}</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat-value">{highPriorityCards.length}</div>
            <div className="welcome-stat-label">{language === 'ar' ? 'عالية الأولوية' : 'High Priority'}</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat-value">{overdueCards.length}</div>
            <div className="welcome-stat-label">{language === 'ar' ? 'متأخرة' : 'Overdue'}</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(79,70,229,0.1)', color: 'var(--primary)'}}>📋</div>
          <div className="stat-value">{totalCards}</div>
          <div className="stat-label">{language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16,185,129,0.1)', color: 'var(--success)'}}>✅</div>
          <div className="stat-value">{doneCards}</div>
          <div className="stat-label">{language === 'ar' ? 'مكتملة' : 'Completed'}</div>
          {totalCards > 0 && (
            <div className="stat-trend" style={{background: 'rgba(16,185,129,0.1)', color: 'var(--success)'}}>
              {Math.round((doneCards / totalCards) * 100)}%
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245,158,11,0.1)', color: 'var(--warning)'}}>🔄</div>
          <div className="stat-value">{inProgressCards}</div>
          <div className="stat-label">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239,68,68,0.1)', color: 'var(--error)'}}>⚠️</div>
          <div className="stat-value">{overdueCards.length}</div>
          <div className="stat-label">{language === 'ar' ? 'متأخرة' : 'Overdue'}</div>
        </div>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd}>
        <div className="quick-add-bar">
          <input
            placeholder={language === 'ar' ? 'اكتب مهمة جديدة واضغط Enter...' : 'Write a new task and press Enter...'}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            autoFocus
          />
          <div className="quick-add-actions">
            <button type="submit" className="btn-primary text-sm px-4 py-2">
              {language === 'ar' ? 'إضافة' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Today's Focus + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Focus */}
        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">📌 {language === 'ar' ? 'مهام اليوم' : "Today's Focus"}</span>
            <span className="chip">{todayCards.length}</span>
          </div>
          <div className="dash-section-body">
            {todayCards.length === 0 ? (
              <div className="empty-dashboard" style={{padding: '30px 20px'}}>
                <div className="empty-icon">🎉</div>
                <h3>{language === 'ar' ? 'لا توجد مهام اليوم' : 'No tasks today'}</h3>
                <p>{language === 'ar' ? 'أضف مهمة جديدة من شريط الإضافة السريعة أعلاه' : 'Add a new task from the quick-add bar above'}</p>
              </div>
            ) : (
              todayCards.map((card) => {
                const completed = card.subtasks.filter((s) => s.done).length;
                const total = card.subtasks.length;
                return (
                  <div key={card.id} className="today-task" onClick={() => onOpenCard(card)}>
                    <div className={`task-check ${false ? 'done' : ''}`} />
                    <div className="task-info">
                      <div className="task-title">{card.title}</div>
                      <div className="task-meta">
                        <div className="task-priority" style={{
                          background: card.priority === "High" ? 'var(--error)' : card.priority === "Medium" ? 'var(--warning)' : 'var(--success)'
                        }} />
                        {card.members.length > 0 && <span>{card.members.map(m => m.avatar || "👤").join(' ')}</span>}
                        {total > 0 && <span>{completed}/{total}</span>}
                      </div>
                    </div>
                    {card.priority === "High" && <span className="badge badge-error">{language === 'ar' ? 'عالية' : 'High'}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">📅 {language === 'ar' ? 'المواعيد القادمة' : 'Upcoming Deadlines'}</span>
          </div>
          <div className="dash-section-body">
            {upcomingCards.length === 0 ? (
              <div className="empty-dashboard" style={{padding: '30px 20px'}}>
                <div className="empty-icon">📅</div>
                <h3>{language === 'ar' ? 'لا توجد مواعيد قادمة' : 'No upcoming deadlines'}</h3>
                <p>{language === 'ar' ? 'أضف تاريخ استحقاق للمهام لتظهر هنا' : 'Add due dates to tasks to see them here'}</p>
              </div>
            ) : (
              upcomingCards.map((card) => (
                <div key={card.id} className="today-task" onClick={() => onOpenCard(card)}>
                  <div className="task-info">
                    <div className="task-title">{card.title}</div>
                    <div className="task-meta">
                      <span>📅 {card.dueDate}</span>
                      {card.members.length > 0 && <span>{card.members.map(m => m.avatar || "👤").join(' ')}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dash-section">
        <div className="dash-section-header">
          <span className="dash-section-title">⚡ {language === 'ar' ? 'آخر النشاطات' : 'Recent Activity'}</span>
        </div>
        <div className="dash-section-body">
          {allActivity.length === 0 ? (
            <div className="empty-dashboard" style={{padding: '20px'}}>
              <p>{language === 'ar' ? 'لا توجد نشاطات بعد' : 'No activity yet'}</p>
            </div>
          ) : (
            allActivity.map((a) => (
              <div key={a.id} className="activity-item" onClick={() => onOpenCard({ id: a.cardId } as Card)} style={{cursor: 'pointer'}}>
                <div className="activity-dot" />
                <div className="flex-1 min-w-0">
                  <div className="activity-text">{a.message}</div>
                  <div className="activity-time">
                    {new Date(a.at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    <span style={{color: 'var(--primary)', marginLeft: 8}}>{a.cardTitle}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
