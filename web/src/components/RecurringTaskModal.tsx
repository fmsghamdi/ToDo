import React, { useState } from 'react';
import type { Card, RecurrencePattern } from '../Types';
import { useLanguage } from '../i18n/useLanguage';

interface RecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRecurring: (card: Card, recurrence: RecurrencePattern) => void;
  baseCard: Card;
}

const RecurringTaskModal: React.FC<RecurringTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateRecurring,
  baseCard
}) => {
  const { t } = useLanguage();
  const [recurrence, setRecurrence] = useState<RecurrencePattern>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1], // Monday by default
  });
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>('never');
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState(10);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalRecurrence: RecurrencePattern = {
      ...recurrence,
      endDate: endType === 'date' ? endDate : undefined,
      occurrences: endType === 'occurrences' ? occurrences : undefined,
    };

    const recurringCard: Card = {
      ...baseCard,
      id: `recurring-${Date.now()}`,
      isRecurring: true,
      recurrence: finalRecurrence,
      activity: [
        ...baseCard.activity,
        {
          id: Date.now().toString(),
          type: 'created',
          message: `Recurring task created with ${recurrence.type} pattern`,
          at: Date.now(),
        }
      ]
    };

    onCreateRecurring(recurringCard, finalRecurrence);
    onClose();
  };

  const handleDayOfWeekToggle = (day: number) => {
    const currentDays = recurrence.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    setRecurrence(prev => ({ ...prev, daysOfWeek: newDays }));
  };

  const weekDays = [
    { value: 0, label: 'Sun', labelAr: 'أحد' },
    { value: 1, label: 'Mon', labelAr: 'اثنين' },
    { value: 2, label: 'Tue', labelAr: 'ثلاثاء' },
    { value: 3, label: 'Wed', labelAr: 'أربعاء' },
    { value: 4, label: 'Thu', labelAr: 'خميس' },
    { value: 5, label: 'Fri', labelAr: 'جمعة' },
    { value: 6, label: 'Sat', labelAr: 'سبت' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          🔄 {t.createRecurring}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Task Preview:</h3>
            <div className="text-sm">
              <div className="font-medium">{baseCard.title}</div>
              {baseCard.description && (
                <div className="text-gray-600 mt-1">{baseCard.description}</div>
              )}
            </div>
          </div>

          {/* Recurrence Type */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.recurrence} Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecurrence(prev => ({ ...prev, type }))}
                  className={`p-3 rounded border text-sm ${
                    recurrence.type === type
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {type === 'daily' ? t.daily :
                   type === 'weekly' ? t.weekly :
                   type === 'monthly' ? t.monthly : t.yearly}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.every} {recurrence.interval} {
                recurrence.type === 'daily' ? t.days :
                recurrence.type === 'weekly' ? t.weeks :
                recurrence.type === 'monthly' ? t.months : t.years
              }
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={recurrence.interval}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                interval: parseInt(e.target.value) || 1 
              }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Days of Week (for weekly) */}
          {recurrence.type === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">{t.daysOfWeek}</label>
              <div className="flex gap-2 flex-wrap">
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayOfWeekToggle(day.value)}
                    className={`px-3 py-2 rounded text-sm border ${
                      recurrence.daysOfWeek?.includes(day.value)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {day.labelAr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {recurrence.type === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-2">{t.dayOfMonth}</label>
              <input
                type="number"
                min="1"
                max="31"
                value={recurrence.dayOfMonth || 1}
                onChange={(e) => setRecurrence(prev => ({ 
                  ...prev, 
                  dayOfMonth: parseInt(e.target.value) || 1 
                }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium mb-2">End Condition</label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === 'never'}
                  onChange={(e) => setEndType(e.target.value as 'never' | 'date' | 'occurrences')}
                />
                <span>Never end</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="date"
                  checked={endType === 'date'}
                  onChange={(e) => setEndType(e.target.value as 'never' | 'date' | 'occurrences')}
                />
                <span>{t.endDate}</span>
                {endType === 'date' && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ml-2 border rounded px-2 py-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="occurrences"
                  checked={endType === 'occurrences'}
                  onChange={(e) => setEndType(e.target.value as 'never' | 'date' | 'occurrences')}
                />
                <span>{t.endAfter}</span>
                {endType === 'occurrences' && (
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                    className="ml-2 w-20 border rounded px-2 py-1"
                  />
                )}
                {endType === 'occurrences' && <span>{t.occurrences}</span>}
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Preview:</h4>
            <div className="text-sm text-gray-700">
              This task will repeat {recurrence.type} every {recurrence.interval} {
                recurrence.type === 'daily' ? 'day(s)' :
                recurrence.type === 'weekly' ? 'week(s)' :
                recurrence.type === 'monthly' ? 'month(s)' : 'year(s)'
              }
              {recurrence.type === 'weekly' && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0 && (
                <span> on {recurrence.daysOfWeek.map(day => 
                  weekDays.find(wd => wd.value === day)?.labelAr
                ).join(', ')}</span>
              )}
              {recurrence.type === 'monthly' && recurrence.dayOfMonth && (
                <span> on day {recurrence.dayOfMonth} of the month</span>
              )}
              {endType === 'date' && endDate && <span> until {endDate}</span>}
              {endType === 'occurrences' && <span> for {occurrences} times</span>}
              {endType === 'never' && <span> indefinitely</span>}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              {t.createRecurring}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTaskModal;
