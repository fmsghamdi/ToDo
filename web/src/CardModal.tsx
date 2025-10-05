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
} from "./Types";
import { LABEL_PRESETS, PRIORITY_PRESETS } from "./Types";
import TimeTracker from "./components/TimeTracker";
import RecurringTaskModal from "./components/RecurringTaskModal";
import type { User } from "./UserTypes";
import { useLanguage } from "./i18n/useLanguage";

type Props = {
  card: Card;
  onUpdate: (updated: Card) => void;
  onDelete: (cardId: string) => void;
  onClose: () => void;
  availableMembers: Member[];
  currentUser?: User;
};

const CardModal: React.FC<Props> = ({ card, onUpdate, onDelete, onClose, availableMembers, currentUser }) => {
  const { t } = useLanguage();
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
  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentInput.trim(),
      at: Date.now(),
    };
    setComments((prev) => [...prev, newComment]);
    logActivity("comment", `Added comment: "${commentInput.trim()}"`);
    setCommentInput("");
  };

  // ---------- Progress ----------
  const completed = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-[900px] h-[90vh] shadow-lg relative flex gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>

        {/* Left column */}
        <div className="flex-1 flex flex-col overflow-y-auto pr-2">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full border p-3 mb-3 rounded font-semibold text-lg"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add description..."
            className="w-full border p-3 mb-4 rounded min-h-[80px]"
          />

          {/* Due Date */}
          <h3 className="font-semibold mb-2">Due Date</h3>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          />

          {/* Attachments */}
          <h3 className="font-semibold">Attachments</h3>
          <input type="file" onChange={handleFileUpload} className="mb-2" />
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              placeholder="Paste a link..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleAddLink}
              className="bg-blue-500 text-white px-3 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <ul className="mb-3">
            {attachments.map((att) => (
              <li key={att.id} className="flex justify-between items-center text-sm border-b py-1">
                <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  📎 {att.name}
                </a>
                <button
                  onClick={() => deleteAttachment(att.id)}
                  className="text-red-500 hover:underline text-xs"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {/* Comments */}
          <h3 className="font-semibold mt-2">Comments</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleAddComment}
              className="bg-green-500 text-white px-3 rounded hover:bg-green-600"
            >
              Add
            </button>
          </div>
          <ul className="mb-3 max-h-32 overflow-y-auto border p-2 rounded text-sm">
            {comments.map((c) => (
              <li key={c.id} className="mb-1">
                <span className="text-gray-700">{c.text}</span>{" "}
                <span className="text-xs text-gray-400">
                  ({new Date(c.at).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>

          {/* Time Tracker */}
          {currentUser && (
            <div className="mb-4">
              <TimeTracker
                card={card}
                currentUser={currentUser}
                onUpdateCard={onUpdate}
              />
            </div>
          )}

          {/* Activity Log */}
          <h3 className="font-semibold mt-2">Activity Log</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400">No activity yet.</p>
          ) : (
            <ul className="mt-2 text-sm max-h-40 overflow-y-auto border-t pt-2">
              {activity.map((a) => (
                <li key={a.id} className="mb-1 text-gray-600">
                  [{new Date(a.at).toLocaleString()}] {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="w-[300px] flex flex-col">
          {/* Subtasks */}
          <h3 className="font-semibold mb-2">Subtasks</h3>
          <div className="max-h-48 overflow-y-auto border p-2 rounded mb-2">
            {subtasks.length === 0 && <p className="text-sm text-gray-400 mb-2">No subtasks yet</p>}
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={st.done} onChange={() => toggleSubtask(st.id)} />
                <input
                  type="text"
                  value={st.title}
                  onChange={(e) => changeSubtaskTitle(st.id, e.target.value)}
                  className={`flex-1 border-b focus:outline-none px-2 py-1 ${
                    st.done ? "line-through text-gray-400" : ""
                  }`}
                />
                <button onClick={() => deleteSubtask(st.id)} className="text-red-500 px-2">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={addSubtask} className="text-purple-600 text-sm mb-3 hover:underline">
            + Add Subtask
          </button>

          {/* Progress */}
          <h3 className="font-semibold mt-3">Progress</h3>
          <div className="w-full bg-gray-200 rounded h-2 mb-1">
            <div className="bg-green-500 h-2 rounded" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {completed}/{total} ({progress}%)
          </p>

          {/* Labels */}
          <h3 className="font-semibold">Labels</h3>
          <div className="flex gap-2 flex-wrap mb-3">
            {LABEL_PRESETS.map((lbl) => {
              const active = labels.some((l) => l.id === lbl.id);
              return (
                <button
                  key={lbl.id}
                  onClick={() => toggleLabel(lbl)}
                  className="px-3 py-1 rounded text-sm border"
                  style={{
                    backgroundColor: active ? lbl.color : "#fff",
                    color: active ? "#fff" : lbl.color,
                    borderColor: lbl.color,
                  }}
                >
                  {active ? "✓ " : "+ "} {lbl.name}
                </button>
              );
            })}
          </div>

          {/* Members */}
          <h3 className="font-semibold">Members</h3>
          <div className="flex gap-2 flex-wrap mb-3 max-h-32 overflow-y-auto">
            {availableMembers.map((m) => {
              const active = members.some((mm) => mm.id === m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    active 
                      ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  }`}
                  title={m.name}
                >
                  <span className="text-sm">{m.avatar || "👤"}</span>
                  <span className="text-xs font-medium truncate max-w-16">{m.name}</span>
                  {active && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          {availableMembers.length > 6 && (
            <p className="text-xs text-gray-500 mb-3">
              {members.length} من {availableMembers.length} أعضاء محددين
            </p>
          )}

          {/* Priority */}
          <h3 className="font-semibold">Priority</h3>
          <div className="flex gap-2 mb-3">
            {PRIORITY_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                className={`px-3 py-1 rounded text-sm border ${
                  priority === p ? "bg-red-500 text-white" : "bg-white text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Recurring Task Button */}
          <div className="mb-3">
            <button
              onClick={() => setShowRecurringModal(true)}
              className="w-full bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 text-sm flex items-center justify-center gap-2"
            >
              🔄 {t.repeatTask}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-auto pt-4">
            <button
              onClick={() => onDelete(card.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
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
    </div>
  );
};

export default CardModal;
