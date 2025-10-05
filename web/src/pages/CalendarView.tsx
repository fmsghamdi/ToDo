import React, { useState, useMemo } from "react";
import type { Column, Card } from "../Types";
import type { User } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

interface CalendarViewProps {
  columns: Column[];
  currentUser: User;
  onCardClick: (card: Card) => void;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  cards: Card[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
  columns,
  currentUser,
  onCardClick,
}) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get all cards with due dates
  const cardsWithDueDates = useMemo(() => {
    const allCards: Card[] = [];
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.dueDate) {
          // Check if user can access this card
          const canAccess = currentUser.role === "admin" || 
                           card.members.some(member => member.id === currentUser.id);
          if (canAccess) {
            allCards.push(card);
          }
        }
      });
    });
    return allCards;
  }, [columns, currentUser]);

  // Generate calendar days for month view
  const generateMonthDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the last day of the week containing the last day of the month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    
    while (currentDateObj <= endDate) {
      const dateString = currentDateObj.toISOString().split('T')[0];
      const dayCards = cardsWithDueDates.filter(card => card.dueDate === dateString);
      
      days.push({
        date: new Date(currentDateObj),
        dateString,
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === today.toDateString(),
        cards: dayCards,
      });
      
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  // Generate calendar days for week view
  const generateWeekDays = (date: Date): CalendarDay[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDateObj = new Date(startOfWeek);
      currentDateObj.setDate(startOfWeek.getDate() + i);
      
      const dateString = currentDateObj.toISOString().split('T')[0];
      const dayCards = cardsWithDueDates.filter(card => card.dueDate === dateString);
      
      days.push({
        date: new Date(currentDateObj),
        dateString,
        isCurrentMonth: true,
        isToday: currentDateObj.toDateString() === today.toDateString(),
        cards: dayCards,
      });
    }
    
    return days;
  };

  const calendarDays = viewMode === "month" 
    ? generateMonthDays(currentDate)
    : generateWeekDays(currentDate);

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format month/year for header
  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };
    
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} ${currentDate.getFullYear()}`;
    }
    
    return currentDate.toLocaleDateString('ar-SA', options);
  };

  // Get card priority color
  const getCardPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High": return "bg-red-500";
      case "Medium": return "bg-yellow-500";
      case "Low": return "bg-green-500";
      default: return "bg-blue-500";
    }
  };

  // Check if card is overdue
  const isCardOverdue = (card: Card) => {
    if (!card.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return card.dueDate < today;
  };

  const weekDays = language === 'ar'
    ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t.calendar} 📅</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === "month" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {language === 'ar' ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === "week" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {language === 'ar' ? 'أسبوعي' : 'Weekly'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          >
            {language === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded hover:bg-gray-100"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {formatHeaderDate()}
            </h2>
            <button
              onClick={goToNext}
              className="p-2 rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border border-gray-200 ${
              !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
            } ${day.isToday ? "bg-blue-50 border-blue-300" : ""}`}
          >
            {/* Date number */}
            <div className={`text-sm font-medium mb-2 ${
              !day.isCurrentMonth ? "text-gray-400" : 
              day.isToday ? "text-blue-600 font-bold" : "text-gray-700"
            }`}>
              {day.date.getDate()}
            </div>

            {/* Cards for this day */}
            <div className="space-y-1">
              {day.cards.slice(0, viewMode === "month" ? 3 : 10).map((card) => (
                <div
                  key={card.id}
                  onClick={() => onCardClick(card)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 text-white truncate ${
                    getCardPriorityColor(card.priority)
                  } ${isCardOverdue(card) ? "ring-2 ring-red-300" : ""}`}
                  title={`${card.title}${isCardOverdue(card) ? (language === 'ar' ? " (متأخرة)" : " (Overdue)") : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {isCardOverdue(card) && <span>🚨</span>}
                    <span className="truncate">{card.title}</span>
                  </div>
                </div>
              ))}
              
              {/* Show more indicator */}
              {day.cards.length > (viewMode === "month" ? 3 : 10) && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.cards.length - (viewMode === "month" ? 3 : 10)} {language === 'ar' ? 'أخرى' : 'more'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>{t.high}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>{t.medium}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>{t.low}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>{language === 'ar' ? 'بدون أولوية' : 'No Priority'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🚨</span>
          <span>{language === 'ar' ? 'متأخرة' : 'Overdue'}</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
