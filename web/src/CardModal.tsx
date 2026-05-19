import React, { useEffect, useState } from "react";
import type {
  Card,
  Subtask,
  Activity,
  Label,
  Attachment,
  Comment,
  Member,
  Priority,
  AssignRequest,
} from "./Types";
import { LABEL_PRESETS, PRIORITY_PRESETS } from "./Types";
import TimeTracker from "./components/TimeTracker";
import RecurringTaskModal from "./components/RecurringTaskModal";
import AssignRequestsPanel from "./components/AssignRequestsPanel";
import type { User } from "./UserTypes";
import { useLanguage } from "./i18n/useLanguage";

type Props = {
  card: Card;
  onUpdate: (updated: Card) => void;
  onDelete: (cardId: string) => void;
  onClose: () => void;
  availableMembers: Member[];
  currentUser?: User;
  assignRequests: AssignRequest[];
  onRequestAssign: (req: Omit<AssignRequest, "id" | "createdAt" | "updatedAt">) => void;
  onApproveAssign: (reqId: string) => void;
  onRejectAssign: (reqId: string) => void;
};

const CardModal: React.FC<Props> = ({ card, onUpdate, onDelete, onClose, availableMembers, currentUser, assignRequests, onRequestAssign, onApproveAssign, onRejectAssign }) => {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [subtasks, setSubtasks] = useState<Subtask[]>(card.subtasks || []);
  const [labels, setLabels] = useState<Label[]>(card.labels || []);
  const [dueDate, setDueDate] = useState<string>(card.dueDate || "");
  const [attachments, setAttachments] = useState<Attachment[]>(card.attachments || []);
  const [comments, setComments] = useState<Comment[]>(card.comments || []);
  const [activity, setActivity] = useState<Activity[]>(card.activity || []);
  const [members, setMembers] = useState<Member[]>(card.members || []);
  const [priority, setPriority] = useState<Priority>(card.priority || "Medium");

  const [commentInput, setCommentInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(-1);

  // --- Activity logger ---
  const logActivity = (type: Activity["type"], message: string) => {
    const entry: Activity = {
      id: Date.now().toString(),
      type,
      message,
      at: Date.now(),
    };
    setActivity((prev) => [...prev, entry]);
  };

  // --- Auto-save to parent ---
  useEffect(() => {
    onUpdate({
      ...card,
      title,
      description,
      subtasks,
      labels,
      dueDate,
      attachments,
      comments,
      members,
      activity,
      priority,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, subtasks, labels, dueDate, attachments, comments, members, activity, priority]);

  // ---------- Title / Description ----------
  const handleTitleBlur = () => {
    if (title !== card.title) logActivity("updated", `Changed title to "${title}"`);
  };

  const handleDescriptionBlur = () => {
    if (description !== card.description) logActivity("updated", `Updated description`);
  };

  // ---------- Due Date ----------
  const handleDueDateChange = (newDate: string) => {
    setDueDate(newDate);
    logActivity("dueDate", `Set due date to ${newDate}`);
  };

  // ---------- Subtasks ----------
  const addSubtask = () => {
    const newSub: Subtask = { id: Date.now().toString(), title: "New subtask", done: false };
    setSubtasks((prev) => [...prev, newSub]);
    logActivity("subtask", `Added subtask "${newSub.title}"`);
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s));
      const st = next.find((s) => s.id === id);
      if (st) logActivity("subtask", `Toggled subtask "${st.title}"`);
      return next;
    });
  };

  const changeSubtaskTitle = (id: string, newTitle: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  const deleteSubtask = (id: string) => {
    const st = subtasks.find((s) => s.id === id);
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    if (st) logActivity("subtask", `Deleted subtask "${st.title}"`);
  };

  // ---------- Labels ----------
  const toggleLabel = (label: Label) => {
    const exists = labels.some((l) => l.id === label.id);
    if (exists) {
      setLabels((prev) => prev.filter((l) => l.id !== label.id));
      logActivity("label", `Removed label "${label.name}"`);
    } else {
      setLabels((prev) => [...prev, label]);
      logActivity("label", `Added label "${label.name}"`);
    }
  };

  // ---------- Members ----------
  const toggleMember = (member: Member) => {
    const exists = members.some((m) => m.id === member.id);
    if (exists) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      logActivity("member", `Removed member "${member.name}"`);
    } else {
      setMembers((prev) => [...prev, member]);
      logActivity("member", `Added member "${member.name}"`);
      if (window.addNotification) {
        window.addNotification({
          type: "task_assigned",
          title: language === "ar" ? "تم تعيينك في مهمة" : "Task Assigned",
          message: language === "ar"
            ? `تم تعيينك في مهمة "${card.title}" بواسطة ${currentUser?.name || "مستخدم"}`
            : `You were assigned to "${card.title}" by ${currentUser?.name || "a user"}`,
          cardId: card.id,
          cardTitle: card.title,
          priority: "medium",
        });
      }
    }
  };

  // ---------- Priority ----------
  const handlePriorityChange = (p: Priority) => {
    setPriority(p);
    logActivity("priority", `Set priority to "${p}"`);
  };

  // ---------- Attachments ----------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;

    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
    };

    setAttachments((prev) => [...prev, newAttachment]);
    logActivity("attachment", `Added attachment "${file.name}"`);
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;

    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: linkInput,
      url: linkInput,
    };

    setAttachments((prev) => [...prev, newAttachment]);
    logActivity("attachment", `Added link "${linkInput}"`);
    setLinkInput("");
  };

  const deleteAttachment = (id: string) => {
    const att = attachments.find((a) => a.id === id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (att) logActivity("attachment", `Deleted attachment "${att.name}"`);
  };

  // ---------- Comments ----------
  const handleCommentChange = (value: string) => {
    setCommentInput(value);
    const atMatch = value.lastIndexOf("@");
    if (atMatch !== -1 && (atMatch === 0 || value[atMatch - 1] === " ")) {
      const search = value.slice(atMatch + 1).split(" ")[0];
      if (search.length > 0) {
        setMentionSearch(search);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMention = (user: Member) => {
    const atMatch = commentInput.lastIndexOf("@");
    const before = commentInput.slice(0, atMatch);
    const after = commentInput.slice(atMatch + mentionSearch.length + 1);
    setCommentInput(`${before}@${user.name} ${after}`);
    setShowMentions(false);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      const filtered = availableMembers.filter(m =>
        m.name.toLowerCase().includes(mentionSearch.toLowerCase())
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && mentionIndex >= 0 && filtered[mentionIndex]) {
        e.preventDefault();
        selectMention(filtered[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }
  };

  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-blue-600 font-medium">{part}</span>
      ) : (
        part
      )
    );
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      at: Date.now(),
    };
    setComments((prev) => [...prev, newComment]);
    logActivity("comment", `Added comment: "${text}"`);

    // Fire @mention notifications
    const mentionMatches = text.match(/@(\w+)/g);
    if (mentionMatches) {
      mentionMatches.forEach(match => {
        const name = match.slice(1);
        const mentionedUser = availableMembers.find(m => m.name === name);
        if (mentionedUser && window.addNotification) {
          window.addNotification({
            type: "user_mentioned",
            title: "تم ذكرك",
            message: `تم ذكرك بواسطة ${currentUser?.name || "مستخدم"} في تعليق: "${text}"`,
            cardId: card.id,
            cardTitle: card.title,
            priority: "medium",
          });
        }
      });
    }

    setCommentInput("");
  };

  // ---------- Progress ----------
  const completed = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <>
      <div className="card-modal-overlay" onClick={onClose} />
      <div className="card-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="card-modal-header">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg lg:text-lg text-base font-bold bg-transparent border-none outline-none flex-1"
            style={{color: 'var(--text-primary)'}}
          />
          <button onClick={onClose} className="btn-ghost p-2 text-xl leading-none ml-2">✕</button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
          {/* Main content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 lg:space-y-5">
            {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add description..."
                className="input min-h-[100px] lg:min-h-[80px] resize-y text-sm"
              />

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{color: 'var(--text-secondary)'}}>{language === 'ar' ? 'المهام الفرعية' : 'Subtasks'}</h3>
                {total > 0 && <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>{completed}/{total}</span>}
              </div>
              {total > 0 && (
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="space-y-1 mb-2">
                {subtasks.length === 0 && (
                  <p className="text-sm" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'لا توجد مهام فرعية بعد' : 'No subtasks yet'}</p>
                )}
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface transition-colors">
                    <button
                      onClick={() => toggleSubtask(st.id)}
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        st.done ? 'bg-success border-success' : 'border-border-default hover:border-primary'
                      }`}
                    >
                      {st.done && <span className="text-white text-[9px]">✓</span>}
                    </button>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => changeSubtaskTitle(st.id, e.target.value)}
                      className={`flex-1 bg-transparent border-none focus:outline-none text-sm px-1 py-0.5 ${
                        st.done ? 'line-through' : ''
                      }`}
                      style={st.done ? {color: 'var(--text-tertiary)'} : {color: 'var(--text-primary)'}}
                    />
                    <button onClick={() => deleteSubtask(st.id)} className="text-xs px-1.5 py-0.5 rounded hover:bg-error/10 hover:text-error transition-colors" style={{color: 'var(--text-tertiary)'}}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addSubtask} className="btn-ghost text-sm lg:text-xs w-full text-center py-2.5 lg:py-1.5 border border-dashed border-border-default rounded-lg hover:border-primary hover:text-primary transition-colors">
                + {language === 'ar' ? 'أضف مهمة فرعية' : 'Add Subtask'}
              </button>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{language === 'ar' ? 'التعليقات' : 'Comments'}</h3>
              <div className="flex gap-2 mb-2 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'اكتب تعليق... (@ لذكر عضو)' : 'Write a comment... (@ to mention)'}
                    value={commentInput}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    className="input text-sm py-2.5 lg:py-1.5"
                  />
                  <button onClick={handleAddComment} className="btn-primary text-sm lg:text-xs px-4 py-2.5 lg:py-1.5">{language === 'ar' ? 'إضافة' : 'Add'}</button>
              </div>
            </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'لا توجد تعليقات' : 'No comments'}</p>}
                {comments.map((c) => (
                  <div key={c.id} className="text-xs py-1.5 px-3 rounded-lg bg-surface border border-border-light">
                    <span style={{color: 'var(--text-primary)'}}>{renderCommentText(c.text)}</span>
                    <span className="text-xs ml-2" style={{color: 'var(--text-tertiary)'}}>{new Date(c.at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{language === 'ar' ? 'النشاطات' : 'Activity'}</h3>
              {activity.length === 0 ? (
                <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'لا توجد نشاطات بعد' : 'No activity yet'}</p>
              ) : (
                <div className="space-y-1">
                  {activity.map((a) => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-dot" />
                      <div>
                        <div className="activity-text">{a.message}</div>
                        <div className="activity-time">{new Date(a.at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{color: 'var(--text-secondary)'}}>{language === 'ar' ? 'المرفقات' : 'Attachments'}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-surface border border-border-light">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px]">
                      📎 {att.name}
                    </a>
                    <button onClick={() => deleteAttachment(att.id)} className="hover:text-error ml-1">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="btn-ghost text-xs cursor-pointer py-1.5 px-3 border border-dashed border-border-default rounded-lg hover:border-primary">
                  📁 {language === 'ar' ? 'رفع ملف' : 'Upload file'}
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
                <div className="flex gap-1 flex-1">
                  <input type="url" placeholder={language === 'ar' ? 'أو أضف رابط...' : 'Or paste a link...'} value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="input text-xs flex-1 min-w-0" />
                  <button onClick={handleAddLink} className="btn-secondary text-xs px-3 py-1.5">+</button>
                </div>
              </div>
            </div>

            {/* Time Tracker */}
            {currentUser && (
              <TimeTracker card={card} currentUser={currentUser} onUpdateCard={onUpdate} />
            )}
          </div>

          {/* Sidebar metadata */}
          <div className="w-full lg:w-[200px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border-light p-4 lg:p-4 space-y-4 lg:overflow-y-auto">
            {/* Priority */}
            <div>
              <h4 className="text-xs lg:text-xs font-semibold mb-1.5" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'الأولوية' : 'Priority'}</h4>
              <div className="flex gap-1">
                {PRIORITY_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`flex-1 text-xs lg:text-xs px-2 py-2.5 lg:py-1 rounded-md transition-all font-medium ${
                      priority === p
                        ? p === "High" ? 'bg-error text-white' : p === "Medium" ? 'bg-warning text-white' : 'bg-success text-white'
                        : 'bg-white border-2 border-border-default text-text-secondary hover:border-primary'
                    }`}
                  >
                    {p === "High" ? (language === 'ar' ? 'عالية' : 'High') : p === "Medium" ? (language === 'ar' ? 'متوسطة' : 'Med') : (language === 'ar' ? 'منخفضة' : 'Low')}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-xs lg:text-xs font-semibold mb-1.5" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</h4>
              <input type="date" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} className="input text-sm py-2.5 lg:py-1.5" />
            </div>

            {/* Labels */}
            <div>
              <h4 className="text-xs lg:text-xs font-semibold mb-1.5" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'التصنيفات' : 'Labels'}</h4>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_PRESETS.map((lbl) => {
                  const active = labels.some((l) => l.id === lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      onClick={() => toggleLabel(lbl)}
                      className="text-xs px-2.5 py-1.5 rounded-md border transition-all"
                      style={{
                        backgroundColor: active ? lbl.color : 'transparent',
                        color: active ? '#fff' : lbl.color,
                        borderColor: lbl.color,
                      }}
                    >
                      {active ? '✓ ' : ''}{lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Members */}
            <div>
              <h4 className="text-xs lg:text-xs font-semibold mb-1.5" style={{color: 'var(--text-tertiary)'}}>{language === 'ar' ? 'الأعضاء' : 'Members'}</h4>
              <div className="space-y-1">
                {availableMembers.slice(0, 6).map((m) => {
                  const active = members.some((mm) => mm.id === m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m)}
                      className={`flex items-center gap-2 w-full px-3 py-2 lg:px-2 lg:py-1 rounded-md text-sm lg:text-xs transition-all ${
                        active ? 'bg-primary/10 text-primary' : 'hover:bg-surface text-secondary'
                      }`}
                    >
                      <span className="text-base lg:text-xs">{m.avatar || "👤"}</span>
                      <span className="truncate flex-1 text-left">{m.name}</span>
                      {active && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assign Requests */}
            {currentUser && (
              <AssignRequestsPanel
                requests={assignRequests}
                currentUser={currentUser}
                cardMembers={members}
                cardId={card.id}
                cardTitle={card.title}
                onRequestAssign={onRequestAssign}
                onApprove={onApproveAssign}
                onReject={onRejectAssign}
              />
            )}

            {/* Recurring Task */}
            <button onClick={() => setShowRecurringModal(true)} className="btn-ghost w-full text-sm lg:text-xs flex items-center justify-center gap-1 py-2.5 lg:py-1.5">
              🔄 {t.repeatTask}
            </button>

            {/* Actions */}
            <div className="space-y-2 pt-3 border-t border-border-light">
              <button onClick={() => onDelete(card.id)} className="w-full text-sm py-2.5 px-3 rounded-md border-2 border-error/30 text-error font-medium hover:bg-error/5 transition-colors">
                {language === 'ar' ? 'حذف المهمة' : 'Delete Task'}
              </button>
              <button onClick={onClose} className="w-full text-sm py-3 px-3 rounded-md bg-primary text-white font-semibold hover:opacity-90 transition-colors shadow-sm">
                {language === 'ar' ? 'حفظ وإغلاق' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>

        {/* Recurring Task Modal */}
        <RecurringTaskModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          onCreateRecurring={(recurringCard) => {
            onUpdate(recurringCard);
            setShowRecurringModal(false);
          }}
          baseCard={card}
        />
      </div>
    </>
  );
};

export default CardModal;
