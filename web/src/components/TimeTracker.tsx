import React, { useState, useEffect } from 'react';
import type { Card, TimeEntry } from '../Types';
import type { User } from '../UserTypes';
import { useLanguage } from '../i18n/useLanguage';

interface TimeTrackerProps {
  card: Card;
  currentUser: User;
  onUpdateCard: (updatedCard: Card) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ card, currentUser, onUpdateCard }) => {
  const { t } = useLanguage();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimer, setCurrentTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [manualTimeEntry, setManualTimeEntry] = useState({
    duration: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isTimerRunning && currentTimer) {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsedTime(now - currentTimer.startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentTimer]);

  // Format time in HH:MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format duration in hours
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Start timer
  const startTimer = () => {
    const newTimer: TimeEntry = {
      id: Date.now().toString(),
      cardId: card.id,
      userId: currentUser.id,
      startTime: Date.now(),
      description: '',
      duration: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setCurrentTimer(newTimer);
    setIsTimerRunning(true);
    setElapsedTime(0);
  };

  // Stop timer
  const stopTimer = () => {
    if (currentTimer) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - currentTimer.startTime) / 1000 / 60); // in minutes
      
      const completedEntry: TimeEntry = {
        ...currentTimer,
        endTime,
        duration
      };

      const updatedCard = {
        ...card,
        timeEntries: [...card.timeEntries, completedEntry],
        actualHours: (card.actualHours || 0) + (duration / 60)
      };

      onUpdateCard(updatedCard);
      setCurrentTimer(null);
      setIsTimerRunning(false);
      setElapsedTime(0);
    }
  };

  // Add manual time entry
  const addManualTimeEntry = () => {
    const duration = parseInt(manualTimeEntry.duration);
    if (isNaN(duration) || duration <= 0) return;

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      cardId: card.id,
      userId: currentUser.id,
      startTime: Date.now(),
      endTime: Date.now(),
      description: manualTimeEntry.description,
      duration,
      date: manualTimeEntry.date
    };

    const updatedCard = {
      ...card,
      timeEntries: [...card.timeEntries, newEntry],
      actualHours: (card.actualHours || 0) + (duration / 60)
    };

    onUpdateCard(updatedCard);
    setShowAddTimeModal(false);
    setManualTimeEntry({
      duration: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Delete time entry
  const deleteTimeEntry = (entryId: string) => {
    const entryToDelete = card.timeEntries.find(entry => entry.id === entryId);
    if (!entryToDelete) return;

    const updatedCard = {
      ...card,
      timeEntries: card.timeEntries.filter(entry => entry.id !== entryId),
      actualHours: Math.max(0, (card.actualHours || 0) - (entryToDelete.duration / 60))
    };

    onUpdateCard(updatedCard);
  };

  // Calculate total time for today
  const getTodayTime = () => {
    const today = new Date().toISOString().split('T')[0];
    return card.timeEntries
      .filter(entry => entry.date === today && entry.userId === currentUser.id)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  // Calculate total time for this week
  const getThisWeekTime = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    return card.timeEntries
      .filter(entry => entry.date >= startOfWeekStr && entry.userId === currentUser.id)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  const totalTime = card.timeEntries
    .filter(entry => entry.userId === currentUser.id)
    .reduce((total, entry) => total + entry.duration, 0);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        ⏱️ {t.timeTracking}
      </h3>

      {/* Timer Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-mono">
            {isTimerRunning ? formatTime(elapsedTime) : '00:00:00'}
          </div>
          <div className="flex gap-2">
            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
              >
                ▶️ {t.startTimer}
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
              >
                ⏹️ {t.stopTimer}
              </button>
            )}
            <button
              onClick={() => setShowAddTimeModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              + {t.logTime}
            </button>
          </div>
        </div>

        {/* Time Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">{t.todayTime}</div>
            <div className="font-semibold">{formatDuration(getTodayTime())}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">{t.thisWeekTime}</div>
            <div className="font-semibold">{formatDuration(getThisWeekTime())}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">{t.totalTime}</div>
            <div className="font-semibold">{formatDuration(totalTime)}</div>
          </div>
        </div>
      </div>

      {/* Estimated vs Actual Hours */}
      {card.estimatedHours && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between items-center">
            <span>{t.estimatedHours}: {card.estimatedHours}h</span>
            <span>{t.actualHours}: {(card.actualHours || 0).toFixed(1)}h</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (card.actualHours || 0) > card.estimatedHours ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, ((card.actualHours || 0) / card.estimatedHours) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Time Entries List */}
      <div>
        <h4 className="font-medium mb-2">{t.timeEntries}</h4>
        {card.timeEntries.filter(entry => entry.userId === currentUser.id).length === 0 ? (
          <p className="text-gray-500 text-sm">No time entries yet</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {card.timeEntries
              .filter(entry => entry.userId === currentUser.id)
              .sort((a, b) => b.startTime - a.startTime)
              .map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{formatDuration(entry.duration)}</div>
                    <div className="text-gray-600">{entry.date}</div>
                    {entry.description && (
                      <div className="text-gray-500 text-xs">{entry.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTimeEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Manual Time Modal */}
      {showAddTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="font-semibold mb-4">{t.addTimeEntry}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.duration} (minutes)</label>
                <input
                  type="number"
                  value={manualTimeEntry.duration}
                  onChange={(e) => setManualTimeEntry(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={manualTimeEntry.date}
                  onChange={(e) => setManualTimeEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={manualTimeEntry.description}
                  onChange={(e) => setManualTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="What did you work on?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddTimeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t.cancel}
              </button>
              <button
                onClick={addManualTimeEntry}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
