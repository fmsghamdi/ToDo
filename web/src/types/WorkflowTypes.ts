// Workflow Automation Types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  executionCount: number;
  lastExecuted?: number;
}

export interface WorkflowTrigger {
  type: TriggerType;
  config: TriggerConfig;
}

export type TriggerType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_completed'
  | 'task_overdue'
  | 'task_assigned'
  | 'due_date_approaching'
  | 'schedule'
  | 'manual';

export interface TriggerConfig {
  // Task-based triggers
  boardId?: string;
  columnId?: string;
  assigneeId?: string;
  priority?: 'High' | 'Medium' | 'Low';
  labels?: string[];
  
  // Schedule trigger
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string; // HH:MM format
    days?: number[]; // 0-6 (Sunday-Saturday)
    date?: number; // Day of month for monthly
    cronExpression?: string; // For custom schedules
  };
  
  // Due date trigger
  daysBeforeDue?: number;
}

export interface WorkflowCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[] | number[];
  logicalOperator?: 'AND' | 'OR';
}

export type ConditionType = 
  | 'task_field'
  | 'user_field'
  | 'board_field'
  | 'time_based'
  | 'custom';

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: ActionConfig;
  order: number;
}

export type ActionType = 
  | 'move_task'
  | 'assign_task'
  | 'add_label'
  | 'remove_label'
  | 'set_priority'
  | 'set_due_date'
  | 'create_subtask'
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'archive_task'
  | 'add_comment'
  | 'webhook'
  | 'integration_sync';

export interface ActionConfig {
  // Move task
  targetColumnId?: string;
  targetBoardId?: string;
  
  // Assign task
  assigneeId?: string;
  assigneeIds?: string[];
  
  // Labels
  labelId?: string;
  labelIds?: string[];
  
  // Priority
  priority?: 'High' | 'Medium' | 'Low';
  
  // Due date
  dueDateOffset?: number; // Days from now
  specificDate?: string;
  
  // Create subtask/task
  taskTitle?: string;
  taskDescription?: string;
  taskPriority?: 'High' | 'Medium' | 'Low';
  
  // Notifications
  notificationType?: 'in_app' | 'email' | 'slack';
  message?: string;
  recipients?: string[];
  
  // Email
  emailSubject?: string;
  emailBody?: string;
  emailTo?: string[];
  
  // Comment
  commentText?: string;
  
  // Webhook
  webhookUrl?: string;
  webhookData?: Record<string, string | number | boolean>;
  
  // Integration
  integrationId?: string;
  syncType?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggeredBy: string;
  triggeredAt: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  executionTime?: number; // milliseconds
  actionsExecuted: number;
  totalActions: number;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  actionId?: string;
  data?: Record<string, string | number | boolean>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  icon: string;
  workflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'executionCount'>;
}

export type WorkflowCategory = 
  | 'task_management'
  | 'notifications'
  | 'project_management'
  | 'team_collaboration'
  | 'reporting'
  | 'integration'
  | 'custom';

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  mostUsedTrigger: TriggerType;
  mostUsedAction: ActionType;
}

// Custom Fields Types
export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  description?: string;
  required: boolean;
  options?: CustomFieldOption[];
  defaultValue?: string | number | boolean | string[];
  validation?: CustomFieldValidation;
  createdAt: number;
  updatedAt: number;
}

export type CustomFieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'percentage';

export interface CustomFieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
}

export interface CustomFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean | string[];
}

// Automation Rules (Simple automation without full workflow)
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    event: string;
    conditions: Record<string, string | number | boolean>;
  };
  action: {
    type: string;
    config: Record<string, string | number | boolean>;
  };
  createdAt: number;
  executionCount: number;
}
