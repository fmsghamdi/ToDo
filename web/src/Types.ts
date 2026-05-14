// === Core Types ===
export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Member = {
  id: string;
  name: string;
  avatar?: string; // could be URL or emoji
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
};

export type Comment = {
  id: string;
  text: string;
  at: number;
};

export type Activity = {
  id: string;
  type:
    | "created"
    | "updated"
    | "opened"
    | "comment"
    | "label"
    | "member"
    | "dueDate"
    | "attachment"
    | "subtask"
    | "priority"
    | "moved";
  message: string;
  at: number;
};

export type Priority = "Low" | "Medium" | "High";

// New types for Planner features
export type RecurrencePattern = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every X days/weeks/months/years
  endDate?: string;
  occurrences?: number; // or end after X occurrences
  daysOfWeek?: number[]; // for weekly: [0,1,2,3,4,5,6] (Sunday=0)
  dayOfMonth?: number; // for monthly: day of month (1-31)
};

export type TimeEntry = {
  id: string;
  cardId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  description?: string;
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
};

// Premium Features Types
export type TaskDependency = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number; // days
};

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  boardId: string;
  isCompleted: boolean;
  color: string;
  dependentTasks: string[]; // task IDs
};

export type Resource = {
  id: string;
  name: string;
  type: 'person' | 'equipment' | 'material';
  costPerHour?: number;
  availability: number; // percentage 0-100
  skills: string[];
};

export type Budget = {
  id: string;
  name: string;
  totalBudget: number;
  spentBudget: number;
  currency: string;
  category: string;
};

export type Risk = {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'analyzing' | 'mitigating' | 'closed';
  mitigation?: string;
  owner?: string;
  dueDate?: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  trigger: {
    type: 'task_created' | 'task_moved' | 'due_date_approaching' | 'task_completed';
    conditions: Record<string, string | number | boolean>;
  };
  actions: {
    type: 'assign_user' | 'set_priority' | 'add_label' | 'send_notification' | 'create_task';
    parameters: Record<string, string | number | boolean>;
  }[];
  isActive: boolean;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
  dueDate?: string;
  startDate?: string; // for timeline view
  labels: Label[];
  members: Member[];
  attachments: Attachment[];
  comments: Comment[];
  activity: Activity[];
  priority?: Priority;
  // New Planner features
  recurrence?: RecurrencePattern;
  isRecurring?: boolean;
  parentRecurrenceId?: string; // for recurring task instances
  estimatedHours?: number;
  actualHours?: number;
  timeEntries: TimeEntry[];
  isTemplate?: boolean; // for project templates
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
  position: number; // for ordering columns
  isDefault?: boolean; // to prevent deletion of default columns
  createdAt?: number;
};

// === Board Types ===
export type Board = {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  members: Member[];
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // user id
  background?: string; // color or image
  isStarred?: boolean;
};

export const LABEL_PRESETS: Label[] = [
  { id: "lbl-urgent", name: "Urgent", color: "#ef4444" }, // red-500
  { id: "lbl-bug", name: "Bug", color: "#f59e0b" }, // amber-500
  { id: "lbl-feat", name: "Feature", color: "#10b981" }, // green-500
  { id: "lbl-ui", name: "UI/UX", color: "#3b82f6" }, // blue-500
];

export const MEMBER_PRESETS: Member[] = [
  { id: "m1", name: "Ali", avatar: "🧑‍💻" },
  { id: "m2", name: "Sara", avatar: "👩‍🎨" },
  { id: "m3", name: "Omar", avatar: "👨‍🔧" },
];

export const PRIORITY_PRESETS: Priority[] = ["Low", "Medium", "High"];

// === Assign Request ===
export type AssignRequest = {
  id: string;
  cardId: string;
  cardTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  updatedAt?: number;
};

// === Board Templates ===
export const BOARD_TEMPLATES = [
  {
    id: "kanban",
    name: "كانبان أساسي",
    description: "لوحة كانبان بسيطة للمشاريع العامة",
    columns: [
      { title: "المهام", position: 0 },
      { title: "قيد التنفيذ", position: 1 },
      { title: "مكتمل", position: 2 },
    ]
  },
  {
    id: "software",
    name: "تطوير البرمجيات",
    description: "لوحة مخصصة لمشاريع تطوير البرمجيات",
    columns: [
      { title: "Backlog", position: 0 },
      { title: "To Do", position: 1 },
      { title: "In Progress", position: 2 },
      { title: "Code Review", position: 3 },
      { title: "Testing", position: 4 },
      { title: "Done", position: 5 },
    ]
  },
  {
    id: "marketing",
    name: "التسويق",
    description: "لوحة لإدارة الحملات التسويقية",
    columns: [
      { title: "أفكار", position: 0 },
      { title: "التخطيط", position: 1 },
      { title: "التصميم", position: 2 },
      { title: "المراجعة", position: 3 },
      { title: "النشر", position: 4 },
      { title: "التحليل", position: 5 },
    ]
  },
  {
    id: "personal",
    name: "شخصي",
    description: "لوحة لإدارة المهام الشخصية",
    columns: [
      { title: "اليوم", position: 0 },
      { title: "هذا الأسبوع", position: 1 },
      { title: "لاحقاً", position: 2 },
      { title: "مكتمل", position: 3 },
    ]
  }
];
