import React, { useState, useEffect, useCallback } from "react";
import type { Column } from "../Types";
import type { User } from "../UserTypes";
import type { Chat } from "../ChatTypes";
import { useLanguage } from "../i18n/useLanguage";

// Extend Window interface to include our custom function
declare global {
  interface Window {
    clearChatNotifications?: (chatId: string) => void;
  }
}

interface Notification {
  id: string;
  type: "task_assigned" | "due_date_approaching" | "task_overdue" | "task_completed" | "task_commented" | "new_message";
  title: string;
  message: string;
  cardId?: string;
  cardTitle?: string;
  chatId?: string;
  timestamp: number;
  isRead: boolean;
  priority: "low" | "medium" | "high";
}

interface NotificationSystemProps {
  currentUser: User;
  columns: Column[];
  users: User[];
  chats: Chat[];
  onClearChatNotifications: (chatId: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  currentUser,
  columns,
  chats,
  onClearChatNotifications,
}) => {
  const { language } = useLanguage();
  // users parameter available but not used in current implementation
  // Can be used for future features like user-specific notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`notifications_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [showNotifications, setShowNotifications] = useState(false);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
  }, [notifications, currentUser.id]);

  // Check for due date notifications
  useEffect(() => {
    const checkDueDates = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      columns.forEach(column => {
        column.cards.forEach(card => {
          // Only check cards assigned to current user or if user is admin
          const isAssigned = card.members.some(member => member.id === currentUser.id);
          const isAdmin = currentUser.role === "admin";
          
          if (!isAssigned && !isAdmin) return;

          if (card.dueDate) {
            const existingNotification = notifications.find(
              n => n.cardId === card.id && (n.type === "due_date_approaching" || n.type === "task_overdue")
            );

            // Check for overdue tasks
            if (card.dueDate < todayStr && !existingNotification) {
              const newNotification: Notification = {
                id: `overdue_${card.id}_${Date.now()}`,
                type: "task_overdue",
                title: language === 'ar' ? "مهمة متأخرة" : "Overdue Task",
                message: language === 'ar' ? `المهمة "${card.title}" متأخرة عن موعدها المحدد` : `Task "${card.title}" is overdue`,
                cardId: card.id,
                cardTitle: card.title,
                timestamp: Date.now(),
                isRead: false,
                priority: "high",
              };
              setNotifications(prev => [...prev, newNotification]);
            }
            // Check for tasks due tomorrow
            else if (card.dueDate === tomorrowStr && !existingNotification) {
              const newNotification: Notification = {
                id: `due_tomorrow_${card.id}_${Date.now()}`,
                type: "due_date_approaching",
                title: language === 'ar' ? "موعد استحقاق قريب" : "Due Soon",
                message: language === 'ar' ? `المهمة "${card.title}" مستحقة غداً` : `Task "${card.title}" is due tomorrow`,
                cardId: card.id,
                cardTitle: card.title,
                timestamp: Date.now(),
                isRead: false,
                priority: "medium",
              };
              setNotifications(prev => [...prev, newNotification]);
            }
            // Check for tasks due today
            else if (card.dueDate === todayStr && !existingNotification) {
              const newNotification: Notification = {
                id: `due_today_${card.id}_${Date.now()}`,
                type: "due_date_approaching",
                title: language === 'ar' ? "مهمة مستحقة اليوم" : "Due Today",
                message: language === 'ar' ? `المهمة "${card.title}" مستحقة اليوم` : `Task "${card.title}" is due today`,
                cardId: card.id,
                cardTitle: card.title,
                timestamp: Date.now(),
                isRead: false,
                priority: "high",
              };
              setNotifications(prev => [...prev, newNotification]);
            }
          }
        });
      });
    };

    // Check immediately and then every hour
    checkDueDates();
    const interval = setInterval(checkDueDates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [columns, currentUser, notifications, language]);

  // Check for new chat messages and create notifications
  useEffect(() => {
    if (!chats) return;

    chats.forEach(chat => {
      // Get unread messages for current user
      const unreadMessages = chat.messages.filter(msg => 
        msg.senderId !== currentUser.id && !msg.isRead
      );

      unreadMessages.forEach(message => {
        // Check if notification already exists for this message
        const existingNotification = notifications.find(
          n => n.type === "new_message" && n.chatId === chat.id && n.id.includes(message.id)
        );

        if (!existingNotification) {
          // Get sender name
          const sender = chat.participants.find(p => p.id === message.senderId);
          const senderName = sender?.name || (language === 'ar' ? 'مستخدم غير معروف' : 'Unknown User');

          const newNotification: Notification = {
            id: `message_${chat.id}_${message.id}_${Date.now()}`,
            type: "new_message",
            title: language === 'ar' ? "رسالة جديدة" : "New Message",
            message: language === 'ar' ? `رسالة من ${senderName}: ${message.content}` : `Message from ${senderName}: ${message.content}`,
            chatId: chat.id,
            timestamp: message.timestamp,
            isRead: false,
            priority: "medium",
          };
          setNotifications(prev => [...prev, newNotification]);
        }
      });
    });
  }, [chats, currentUser.id, notifications, language]);

  // Clear chat notifications when messages are read
  const clearChatNotifications = useCallback((chatId: string) => {
    setNotifications(prev => prev.filter(n => !(n.type === "new_message" && n.chatId === chatId)));
    if (onClearChatNotifications) {
      onClearChatNotifications(chatId);
    }
  }, [onClearChatNotifications]);

  // Expose clearChatNotifications function globally
  useEffect(() => {
    window.clearChatNotifications = clearChatNotifications;
    return () => {
      delete window.clearChatNotifications;
    };
  }, [clearChatNotifications]);

  // Function to add notification (available for future use)
  // const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
  //   const newNotification: Notification = {
  //     ...notification,
  //     id: `${notification.type}_${Date.now()}`,
  //     timestamp: Date.now(),
  //   };
  //   setNotifications(prev => [...prev, newNotification]);
  // };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return language === 'ar' ? "الآن" : "now";
    if (diffInMinutes < 60) return language === 'ar' ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return language === 'ar' ? `منذ ${diffInHours} ساعة` : `${diffInHours} h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return language === 'ar' ? `منذ ${diffInDays} يوم` : `${diffInDays} d ago`;
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_assigned": return "👤";
      case "due_date_approaching": return "⏰";
      case "task_overdue": return "🚨";
      case "task_completed": return "✅";
      case "task_commented": return "💬";
      case "new_message": return "💬";
      default: return "📢";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <div className="text-xl">🔔</div>
        {getUnreadCount() > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getUnreadCount()}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
            <div className="flex gap-2">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  {language === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">🔕</div>
                <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
              </div>
            ) : (
              sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 text-xs ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority === "high"
                            ? (language === 'ar' ? "عالية" : "High")
                            : notification.priority === "medium"
                            ? (language === 'ar' ? "متوسطة" : "Medium")
                            : (language === 'ar' ? "منخفضة" : "Low")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;
