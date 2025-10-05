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
  const { t } = useLanguage();
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] p-6">
        <h2 className="text-lg font-bold mb-4">{t.addTask}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <input
            className="w-full border rounded p-2"
            placeholder={t.taskTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Description */}
          <textarea
            className="w-full border rounded p-2"
            placeholder={t.taskDescription}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Priority */}
          <div>
            <h3 className="font-semibold mb-1">{t.priority}</h3>
            <div className="flex gap-2">
              {["High", "Medium", "Low"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p as "High" | "Medium" | "Low")}
                  className={`px-3 py-1 rounded text-sm text-white ${
                    priority === p
                      ? p === "High"
                        ? "bg-red-600"
                        : p === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                      : "bg-gray-400"
                  }`}
                >
                  {p === "High" ? t.high : p === "Medium" ? t.medium : t.low}
                </button>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="font-semibold mb-1">{t.members}</h3>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
              {availableMembers.map((m) => {
                const active = selectedMembers.some((sm) => sm.id === m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleMember(m)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      active 
                        ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                        : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                    }`}
                    title={m.name}
                  >
                    <span className="text-lg">{m.avatar || "👤"}</span>
                    <span className="text-sm font-medium truncate max-w-20">{m.name}</span>
                    {active && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            {availableMembers.length > 6 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedMembers.length} من {availableMembers.length} أعضاء محددين
              </p>
            )}
          </div>

          {/* Labels */}
          <div>
            <h3 className="font-semibold mb-1">{t.labels}</h3>
            <div className="flex gap-2 flex-wrap">
              {LABEL_PRESETS.map((lbl) => {
                const active = selectedLabels.some((l) => l.id === lbl.id);
                return (
                  <button
                    type="button"
                    key={lbl.id}
                    onClick={() => toggleLabel(lbl)}
                    className={`px-3 py-1 rounded text-sm border`}
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
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.startDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.dueDate}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium mb-1">{t.estimatedHours}</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="8"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-3 py-1 rounded"
            >
              {t.close}
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
