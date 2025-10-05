// Integration Types for External Systems
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: 'connected' | 'disconnected' | 'error';
  config: IntegrationConfig;
  lastSync?: number;
  createdAt: number;
  updatedAt: number;
}

export type IntegrationType = 
  | 'google_calendar'
  | 'outlook_calendar'
  | 'google_drive'
  | 'dropbox'
  | 'onedrive'
  | 'slack'
  | 'email'
  | 'webhook';

export interface IntegrationConfig {
  // Google Calendar
  googleCalendar?: {
    calendarId: string;
    accessToken: string;
    refreshToken: string;
    syncTasks: boolean;
    syncDeadlines: boolean;
    createEvents: boolean;
  };

  // Outlook Calendar
  outlookCalendar?: {
    calendarId: string;
    accessToken: string;
    refreshToken: string;
    syncTasks: boolean;
    syncDeadlines: boolean;
  };

  // Cloud Storage
  cloudStorage?: {
    accessToken: string;
    refreshToken: string;
    autoUpload: boolean;
    folderPath: string;
    maxFileSize: number; // in MB
  };

  // Slack
  slack?: {
    webhookUrl: string;
    channel: string;
    notifyOnTaskCreate: boolean;
    notifyOnTaskComplete: boolean;
    notifyOnDeadline: boolean;
  };

  // Email
  email?: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    fromEmail: string;
    createTasksFromEmail: boolean;
    emailNotifications: boolean;
  };

  // Webhook
  webhook?: {
    url: string;
    secret: string;
    events: WebhookEvent[];
    headers?: Record<string, string>;
  };
}

export type WebhookEvent = 
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'project_created'
  | 'project_updated'
  | 'user_assigned';

export interface SyncResult {
  success: boolean;
  message: string;
  itemsSynced?: number;
  errors?: string[];
  lastSync: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  taskId?: string; // Link to our task
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  createdAt: number;
  taskId?: string; // Link to our task
}

export interface EmailTask {
  id: string;
  subject: string;
  from: string;
  body: string;
  receivedAt: number;
  processed: boolean;
  taskId?: string; // Created task ID
}

export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  lastSyncTime?: number;
  syncErrors: number;
  itemsSynced: number;
}
