import type { 
  Integration, 
  IntegrationType, 
  IntegrationConfig, 
  SyncResult, 
  CalendarEvent, 
  CloudFile,
  IntegrationStats 
} from '../types/IntegrationTypes';
import type { Card } from '../Types';

export class IntegrationService {
  private integrations: Integration[] = [];
  private syncInProgress = false;

  constructor() {
    this.loadIntegrations();
  }

  // Load integrations from localStorage
  private loadIntegrations(): void {
    const saved = localStorage.getItem('integrations');
    if (saved) {
      this.integrations = JSON.parse(saved);
    }
  }

  // Save integrations to localStorage
  private saveIntegrations(): void {
    localStorage.setItem('integrations', JSON.stringify(this.integrations));
  }

  // Get all integrations
  getIntegrations(): Integration[] {
    return this.integrations;
  }

  // Get integration by ID
  getIntegration(id: string): Integration | undefined {
    return this.integrations.find(i => i.id === id);
  }

  // Get integrations by type
  getIntegrationsByType(type: IntegrationType): Integration[] {
    return this.integrations.filter(i => i.type === type);
  }

  // Add new integration
  async addIntegration(
    name: string, 
    type: IntegrationType, 
    config: IntegrationConfig
  ): Promise<Integration> {
    const integration: Integration = {
      id: `integration-${Date.now()}`,
      name,
      type,
      status: 'disconnected',
      config,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Test connection
    const testResult = await this.testConnection(integration);
    integration.status = testResult.success ? 'connected' : 'error';

    this.integrations.push(integration);
    this.saveIntegrations();
    
    return integration;
  }

  // Update integration
  async updateIntegration(id: string, updates: Partial<Integration>): Promise<boolean> {
    const index = this.integrations.findIndex(i => i.id === id);
    if (index === -1) return false;

    this.integrations[index] = {
      ...this.integrations[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveIntegrations();
    return true;
  }

  // Delete integration
  deleteIntegration(id: string): boolean {
    const index = this.integrations.findIndex(i => i.id === id);
    if (index === -1) return false;

    this.integrations.splice(index, 1);
    this.saveIntegrations();
    return true;
  }

  // Test connection to external service
  async testConnection(integration: Integration): Promise<SyncResult> {
    try {
      switch (integration.type) {
        case 'google_calendar':
          return await this.testGoogleCalendar(integration);
        case 'outlook_calendar':
          return await this.testOutlookCalendar(integration);
        case 'google_drive':
        case 'dropbox':
        case 'onedrive':
          return await this.testCloudStorage(integration);
        case 'slack':
          return await this.testSlack(integration);
        case 'email':
          return await this.testEmail(integration);
        case 'webhook':
          return await this.testWebhook(integration);
        default:
          return {
            success: false,
            message: 'Unsupported integration type',
            lastSync: Date.now()
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error}`,
        lastSync: Date.now()
      };
    }
  }

  // Google Calendar Integration
  private async testGoogleCalendar(integration: Integration): Promise<SyncResult> {
    // Simulate API call - in real implementation, use Google Calendar API
    const config = integration.config.googleCalendar;
    if (!config?.accessToken) {
      return {
        success: false,
        message: 'Missing access token',
        lastSync: Date.now()
      };
    }

    // Simulate successful connection
    return {
      success: true,
      message: 'Connected to Google Calendar successfully',
      lastSync: Date.now()
    };
  }

  // Sync task to Google Calendar
  async syncTaskToGoogleCalendar(task: Card, integrationId: string): Promise<boolean> {
    const integration = this.getIntegration(integrationId);
    if (!integration || integration.type !== 'google_calendar' || integration.status !== 'connected') {
      return false;
    }

    try {
      // Simulate creating calendar event
      const event: CalendarEvent = {
        id: `event-${task.id}`,
        title: task.title,
        description: task.description,
        startTime: task.startDate || task.dueDate || new Date().toISOString(),
        endTime: task.dueDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        taskId: task.id
      };

      // In real implementation, call Google Calendar API here
      console.log('Syncing task to Google Calendar:', event);
      
      return true;
    } catch (error) {
      console.error('Failed to sync task to Google Calendar:', error);
      return false;
    }
  }

  // Outlook Calendar Integration
  private async testOutlookCalendar(integration: Integration): Promise<SyncResult> {
    const config = integration.config.outlookCalendar;
    if (!config?.accessToken) {
      return {
        success: false,
        message: 'Missing access token',
        lastSync: Date.now()
      };
    }

    return {
      success: true,
      message: 'Connected to Outlook Calendar successfully',
      lastSync: Date.now()
    };
  }

  // Cloud Storage Integration
  private async testCloudStorage(integration: Integration): Promise<SyncResult> {
    const config = integration.config.cloudStorage;
    if (!config?.accessToken) {
      return {
        success: false,
        message: 'Missing access token',
        lastSync: Date.now()
      };
    }

    return {
      success: true,
      message: `Connected to ${integration.type} successfully`,
      lastSync: Date.now()
    };
  }

  // Upload file to cloud storage
  async uploadToCloudStorage(file: File, integrationId: string, taskId?: string): Promise<CloudFile | null> {
    const integration = this.getIntegration(integrationId);
    if (!integration || !['google_drive', 'dropbox', 'onedrive'].includes(integration.type)) {
      return null;
    }

    try {
      // Simulate file upload
      const cloudFile: CloudFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        downloadUrl: URL.createObjectURL(file), // Temporary URL for demo
        createdAt: Date.now(),
        taskId
      };

      console.log('Uploading file to cloud storage:', cloudFile);
      return cloudFile;
    } catch (error) {
      console.error('Failed to upload file:', error);
      return null;
    }
  }

  // Slack Integration
  private async testSlack(integration: Integration): Promise<SyncResult> {
    const config = integration.config.slack;
    if (!config?.webhookUrl) {
      return {
        success: false,
        message: 'Missing webhook URL',
        lastSync: Date.now()
      };
    }

    return {
      success: true,
      message: 'Connected to Slack successfully',
      lastSync: Date.now()
    };
  }

  // Send notification to Slack
  async sendSlackNotification(message: string, integrationId: string): Promise<boolean> {
    const integration = this.getIntegration(integrationId);
    if (!integration || integration.type !== 'slack' || integration.status !== 'connected') {
      return false;
    }

    try {
      const config = integration.config.slack!;
      
      // Simulate sending to Slack
      console.log(`Sending to Slack channel ${config.channel}:`, message);
      
      // In real implementation, send POST request to webhook URL
      return true;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  // Email Integration
  private async testEmail(integration: Integration): Promise<SyncResult> {
    const config = integration.config.email;
    if (!config?.smtpHost || !config?.username) {
      return {
        success: false,
        message: 'Missing SMTP configuration',
        lastSync: Date.now()
      };
    }

    return {
      success: true,
      message: 'Email configuration validated successfully',
      lastSync: Date.now()
    };
  }

  // Send email notification
  async sendEmailNotification(
    to: string, 
    subject: string, 
    body: string, 
    integrationId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(integrationId);
    if (!integration || integration.type !== 'email' || integration.status !== 'connected') {
      return false;
    }

    try {
      // Simulate sending email
      console.log('Sending email:', { to, subject, body });
      
      // In real implementation, use SMTP to send email
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Webhook Integration
  private async testWebhook(integration: Integration): Promise<SyncResult> {
    const config = integration.config.webhook;
    if (!config?.url) {
      return {
        success: false,
        message: 'Missing webhook URL',
        lastSync: Date.now()
      };
    }

    return {
      success: true,
      message: 'Webhook URL validated successfully',
      lastSync: Date.now()
    };
  }

  // Send webhook notification
  async sendWebhookNotification(
    event: string, 
    data: Record<string, unknown>, 
    integrationId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(integrationId);
    if (!integration || integration.type !== 'webhook' || integration.status !== 'connected') {
      return false;
    }

    try {
      const config = integration.config.webhook!;
      
      // Simulate webhook call
      console.log(`Sending webhook to ${config.url}:`, { event, data });
      
      // In real implementation, send POST request to webhook URL
      return true;
    } catch (error) {
      console.error('Failed to send webhook:', error);
      return false;
    }
  }

  // Sync all integrations
  async syncAll(): Promise<SyncResult[]> {
    if (this.syncInProgress) {
      return [];
    }

    this.syncInProgress = true;
    const results: SyncResult[] = [];

    try {
      for (const integration of this.integrations) {
        if (integration.status === 'connected') {
          const result = await this.syncIntegration(integration.id);
          results.push(result);
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  // Sync specific integration
  async syncIntegration(integrationId: string): Promise<SyncResult> {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      return {
        success: false,
        message: 'Integration not found',
        lastSync: Date.now()
      };
    }

    try {
      // Update last sync time
      await this.updateIntegration(integrationId, { lastSync: Date.now() });

      return {
        success: true,
        message: 'Sync completed successfully',
        itemsSynced: 0, // Would be actual count in real implementation
        lastSync: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${error}`,
        lastSync: Date.now()
      };
    }
  }

  // Get integration statistics
  getStats(): IntegrationStats {
    const activeIntegrations = this.integrations.filter(i => i.status === 'connected').length;
    const lastSyncTimes = this.integrations
      .filter(i => i.lastSync)
      .map(i => i.lastSync!)
      .sort((a, b) => b - a);

    return {
      totalIntegrations: this.integrations.length,
      activeIntegrations,
      lastSyncTime: lastSyncTimes[0],
      syncErrors: this.integrations.filter(i => i.status === 'error').length,
      itemsSynced: 0 // Would track actual synced items
    };
  }

  // Auto-sync based on task events
  async handleTaskEvent(event: string, task: Card): Promise<void> {
    const activeIntegrations = this.integrations.filter(i => i.status === 'connected');

    for (const integration of activeIntegrations) {
      try {
        switch (integration.type) {
          case 'google_calendar':
            if (integration.config.googleCalendar?.syncTasks) {
              await this.syncTaskToGoogleCalendar(task, integration.id);
            }
            break;

          case 'slack': {
            const slackConfig = integration.config.slack;
            if (slackConfig?.notifyOnTaskCreate && event === 'task_created') {
              await this.sendSlackNotification(
                `📝 New task created: ${task.title}`,
                integration.id
              );
            } else if (slackConfig?.notifyOnTaskComplete && event === 'task_completed') {
              await this.sendSlackNotification(
                `✅ Task completed: ${task.title}`,
                integration.id
              );
            }
            break;
          }

          case 'webhook': {
            const webhookConfig = integration.config.webhook;
            if (webhookConfig?.events.includes(event as 'task_created' | 'task_updated' | 'task_completed' | 'task_deleted' | 'project_created' | 'project_updated' | 'user_assigned')) {
              await this.sendWebhookNotification(event, task, integration.id);
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to handle ${event} for integration ${integration.id}:`, error);
      }
    }
  }
}

// Singleton instance
export const integrationService = new IntegrationService();
