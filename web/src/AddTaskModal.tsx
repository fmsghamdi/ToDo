import React, { useState } from "react";
import type { Card, Member, Label } from "./Types";
import { LABEL_PRESETS } from "./Types";
import { useLanguage } from "./i18n/useLanguage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  availableMembers: Member[];
};

export default function AddTaskModal({ isOpen, onClose, onAdd, availableMembers }: Props) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low" | undefined>();
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  if (!isOpen) return null;

  const toggleMember = (member: Member) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) =>
      prev.some((l) => l.id === label.id)
        ? prev.filter((l) => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCard: Card = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      subtasks: [],
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      priority,
      labels: selectedLabels,
      members: selectedMembers,
      attachments: [],
      comments: [],
      activity: [
        {
          id: Date.now().toString(),
          type: "created",
          message: `Task "${title.trim()}" created`,
          at: Date.now(),
        },
      ],
      // New Planner features
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      actualHours: 0,
      timeEntries: [],
    };

    onAdd(newCard);
    setTitle("");
    setDescription("");
    setPriority(undefined);
    setSelectedLabels([]);
    setSelectedMembers([]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>{t.addTask}</h2>
          <button onClick={onClose} className="btn-ghost p-1 text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <input
            className="input"
            placeholder={t.taskTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {/* Description */}
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder={t.taskDescription}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Priority */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{t.priority}</h3>
            <div className="flex gap-2">
              {["High", "Medium", "Low"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p as "High" | "Medium" | "Low")}
                  className={`chip cursor-pointer transition-all ${
                    priority === p
                      ? p === "High" ? 'badge-error' : p === "Medium" ? 'badge-warning' : 'badge-success'
                      : 'hover:border-primary'
                  }`}
                  style={priority === p ? {} : {background: 'var(--bg-card)', color: 'var(--text-secondary)'}}
                >
                  {p === "High" ? t.high : p === "Medium" ? t.medium : t.low}
                </button>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{t.members}</h3>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
              {availableMembers.map((m) => {
                const active = selectedMembers.some((sm) => sm.id === m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleMember(m)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      active 
                        ? "bg-primary text-white border-primary" 
                        : "hover:border-primary bg-surface border-border-default"
                    }`}
                    style={active ? {background: 'var(--primary)', borderColor: 'var(--primary)'} : {}}
                    title={m.name}
                  >
                    <span>{m.avatar || "👤"}</span>
                    <span className="font-medium truncate max-w-20">{m.name}</span>
                    {active && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            {availableMembers.length > 6 && (
              <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>
                {selectedMembers.length} من {availableMembers.length} أعضاء محددين
              </p>
            )}
          </div>

          {/* Labels */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{t.labels}</h3>
            <div className="flex gap-2 flex-wrap">
              {LABEL_PRESETS.map((lbl) => {
                const active = selectedLabels.some((l) => l.id === lbl.id);
                return (
                  <button
                    type="button"
                    key={lbl.id}
                    onClick={() => toggleLabel(lbl)}
                    className="chip cursor-pointer transition-all"
                    style={{
                      backgroundColor: active ? lbl.color : "var(--bg-card)",
                      color: active ? "#fff" : lbl.color,
                      borderColor: lbl.color,
                    }}
                  >
                    {active ? "✓ " : "+ "} {language === 'ar' && lbl.nameAr ? lbl.nameAr : lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>{t.startDate}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>{t.dueDate}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>{t.estimatedHours}</label>
            <input type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className="input" placeholder="8" />
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{t.close}</button>
            <button type="submit" className="btn-primary">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
