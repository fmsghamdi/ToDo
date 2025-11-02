import React, { useState } from 'react';
import type { Board, Card } from '../Types';
import { useLanguage } from '../i18n/useLanguage';

interface TimelineProps {
  boards: Board[];
}

const Timeline: React.FC<TimelineProps> = ({ boards }) => {
  const { t } = useLanguage();
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get all cards with dates from selected board(s)
  const getCardsWithDates = (): Card[] => {
    let allCards: Card[] = [];
    
    if (selectedBoard === 'all') {
      boards.forEach(board => {
        board.columns.forEach(column => {
          allCards = [...allCards, ...column.cards];
        });
      });
    } else {
      const board = boards.find(b => b.id === selectedBoard);
      if (board) {
        board.columns.forEach(column => {
          allCards = [...allCards, ...column.cards];
        });
      }
    }

    return allCards.filter(card => card.startDate || card.dueDate);
  };

  // Generate date range based on view mode
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'week':
        start.setDate(start.getDate() - start.getDay()); // Start of week
        end.setDate(start.getDate() + 6); // End of week
        break;
      case 'month':
        start.setDate(1); // Start of month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // End of month
        break;
      case 'quarter': {
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        end.setMonth(quarter * 3 + 3, 0);
        break;
      }
    }

    return { start, end };
  };

  // Generate date columns
  const generateDateColumns = () => {
    const { start, end } = getDateRange();
    const columns: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      columns.push(new Date(current));
      if (viewMode === 'week') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'month') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7); // Weekly view for quarter
      }
    }

    return columns;
  };

  // Calculate task position and width
  const getTaskPosition = (card: Card) => {
    const startDate = card.startDate ? new Date(card.startDate) : new Date(card.dueDate!);
    const endDate = card.dueDate ? new Date(card.dueDate) : startDate;
    
    const { start: rangeStart, end: rangeEnd } = getDateRange();
    const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const startOffset = Math.max(0, Math.ceil((startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);
    
    return { left: leftPercent, width: widthPercent };
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const cards = getCardsWithDates();
  const dateColumns = generateDateColumns();

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (viewMode === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    } else if (viewMode === 'month') {
      return date.getDate().toString();
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📊 {t.timeline}
            </h1>
            
            {/* View Mode Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Board Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">{t.board}:</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="border rounded px-3 py-1"
              >
                <option value="all">All Boards</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              
              <div className="text-lg font-medium min-w-[200px] text-center">
                {viewMode === 'week' && (
                  `${dateColumns[0]?.toLocaleDateString()} - ${dateColumns[dateColumns.length - 1]?.toLocaleDateString()}`
                )}
                {viewMode === 'month' && (
                  currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                )}
                {viewMode === 'quarter' && (
                  `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`
                )}
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-6">
          {cards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📅</div>
              <p>No tasks with dates found</p>
              <p className="text-sm">Add start dates or due dates to your tasks to see them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Date Headers */}
              <div className="flex border-b pb-2 mb-4 min-w-[800px]">
                <div className="w-48 flex-shrink-0"></div>
                <div className="flex-1 flex">
                  {dateColumns.map((date, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center text-sm font-medium text-gray-600 px-1"
                    >
                      {formatDate(date)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              <div className="space-y-2 min-w-[800px]">
                {cards.map(card => {
                  const position = getTaskPosition(card);
                  const board = boards.find(b => 
                    b.columns.some(col => col.cards.some(c => c.id === card.id))
                  );
                  
                  return (
                    <div key={card.id} className="flex items-center h-12">
                      {/* Task Info */}
                      <div className="w-48 flex-shrink-0 pr-4">
                        <div className="text-sm font-medium truncate" title={card.title}>
                          {card.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {board?.title}
                        </div>
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex-1 relative h-8 bg-gray-100 rounded">
                        <div
                          className="absolute h-6 top-1 rounded flex items-center px-2 text-white text-xs font-medium shadow-sm"
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            backgroundColor: getPriorityColor(card.priority),
                            minWidth: '60px'
                          }}
                          title={`${card.title} (${card.startDate || card.dueDate} - ${card.dueDate || card.startDate})`}
                        >
                          <span className="truncate">
                            {card.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-4 border-t">
                <div className="flex items-center gap-6 text-sm">
                  <span className="font-medium">Priority:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span>No Priority</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
