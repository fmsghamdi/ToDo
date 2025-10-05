import React, { useState, useEffect } from "react";
import type { Column, Priority } from "../Types";
import type { User } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

interface SearchAndFilterProps {
  columns: Column[];
  users: User[];
  onFilteredResults: (filteredColumns: Column[]) => void;
  onClearFilters: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  columns,
  users,
  onFilteredResults,
  onClearFilters,
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "">("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [showOverdue, setShowOverdue] = useState(false);

  // Get all unique labels from all cards
  const allLabels = Array.from(
    new Set(
      columns
        .flatMap(col => col.cards)
        .flatMap(card => card.labels)
        .map(label => label.name)
    )
  );

  // Apply filters
  useEffect(() => {
    if (!searchTerm && !selectedPriority && !selectedMember && !selectedLabel && !showOverdue) {
      onClearFilters();
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const filteredColumns = columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => {
        // Search term filter
        if (searchTerm && !card.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !card.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Priority filter
        if (selectedPriority && card.priority !== selectedPriority) {
          return false;
        }

        // Member filter
        if (selectedMember && !card.members.some(member => member.id === selectedMember)) {
          return false;
        }

        // Label filter
        if (selectedLabel && !card.labels.some(label => label.name === selectedLabel)) {
          return false;
        }

        // Overdue filter
        if (showOverdue) {
          if (!card.dueDate || card.dueDate >= today) {
            return false;
          }
        }

        return true;
      })
    }));

    onFilteredResults(filteredColumns);
  }, [searchTerm, selectedPriority, selectedMember, selectedLabel, showOverdue, columns, onFilteredResults, onClearFilters]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedPriority("");
    setSelectedMember("");
    setSelectedLabel("");
    setShowOverdue(false);
    onClearFilters();
  };

  const hasActiveFilters = searchTerm || selectedPriority || selectedMember || selectedLabel || showOverdue;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={`🔍 ${t.search}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value as Priority | "")}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.priority}</option>
          <option value="High">{t.high}</option>
          <option value="Medium">{t.medium}</option>
          <option value="Low">{t.low}</option>
        </select>

        {/* Member Filter */}
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.members}</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        {/* Label Filter */}
        <select
          value={selectedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.labels}</option>
          {allLabels.map(label => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>

        {/* Overdue Filter */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOverdue}
            onChange={(e) => setShowOverdue(e.target.checked)}
            className="rounded"
          />
          <span>{language === 'ar' ? 'متأخرة' : 'Overdue'}</span>
        </label>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            {t.clear}
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {t.search}: "{searchTerm}"
            </span>
          )}
          {selectedPriority && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
              {t.priority}: {selectedPriority === "High" ? t.high : selectedPriority === "Medium" ? t.medium : t.low}
            </span>
          )}
          {selectedMember && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              {t.members}: {users.find(u => u.id === selectedMember)?.name}
            </span>
          )}
          {selectedLabel && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
              {t.labels}: {selectedLabel}
            </span>
          )}
          {showOverdue && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
              {language === 'ar' ? 'متأخرة' : 'Overdue'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
