import type { WorkflowAction, ActionConfig } from '../types/WorkflowTypes';
import type { Card, Board } from '../Types';
import type { User } from '../UserTypes';

export class WorkflowExecutionEngine {
  private boards: Board[] = [];
  private users: User[] = [];
  private onBoardsUpdate?: (boards: Board[]) => void;
  private onNotificationSend?: (userId: string, message: string) => void;

  constructor() {
    this.loadData();
  }

  // Initialize with current app data
  initialize(
    boards: Board[], 
    users: User[], 
    onBoardsUpdate: (boards: Board[]) => void,
    onNotificationSend: (userId: string, message: string) => void
  ) {
    this.boards = boards;
    this.users = users;
    this.onBoardsUpdate = onBoardsUpdate;
    this.onNotificationSend = onNotificationSend;
  }

  private loadData(): void {
    const boards = localStorage.getItem('boards');
    const users = localStorage.getItem('users');
    
    if (boards) this.boards = JSON.parse(boards);
    if (users) this.users = JSON.parse(users);
  }

  // Execute a workflow action with real implementation
  async executeAction(action: WorkflowAction, context: { task?: Card; boardId?: string }): Promise<boolean> {
    try {
      switch (action.type) {
        case 'assign_task':
          return await this.assignTask(action.config, context.task);
          
        case 'send_notification':
          return await this.sendNotification(action.config, context.task);
          
        case 'move_task':
          return await this.moveTask(action.config, context.task, context.boardId);
          
        case 'set_priority':
          return await this.setPriority(action.config, context.task, context.boardId);
          
        case 'add_comment':
          return await this.addComment(action.config, context.task, context.boardId);
          
        case 'create_task':
          return await this.createTask(action.config, context.boardId);
          
        default:
          console.log(`Action ${action.type} not implemented yet`);
          return true; // Return true for unimplemented actions to avoid breaking workflow
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      return false;
    }
  }

  // Assign task to a user
  private async assignTask(config: ActionConfig, task?: Card): Promise<boolean> {
    if (!task || !config.assigneeId) return false;

    // Find the assignee
    let assignee: User | undefined;
    
    if (config.assigneeId === 'project-manager') {
      // Find the project manager (admin role)
      assignee = this.users.find(u => u.role === 'admin');
    } else {
      // Find specific user by ID
      assignee = this.users.find(u => u.id === config.assigneeId);
    }

    if (!assignee) {
      console.error('Assignee not found');
      return false;
    }

    // Add assignee to task if not already assigned
    const isAlreadyAssigned = task.members.some(m => m.id === assignee!.id);
    if (!isAlreadyAssigned) {
      task.members.push({
        id: assignee.id,
        name: assignee.name,
        avatar: assignee.avatar || '👤'
      });

      // Update the boards
      this.updateTaskInBoards(task);
      
      console.log(`✅ Task "${task.title}" assigned to ${assignee.name}`);
    }

    return true;
  }

  // Send notification to user
  private async sendNotification(config: ActionConfig, task?: Card): Promise<boolean> {
    if (!config.message) return false;

    let recipients: string[] = [];

    // Determine recipients
    if (config.recipients && config.recipients.length > 0) {
      recipients = config.recipients;
    } else if (task) {
      // Send to all task members
      recipients = task.members.map(m => m.id);
    } else {
      // Send to all admins
      recipients = this.users.filter(u => u.role === 'admin').map(u => u.id);
    }

    // Send notifications
    for (const userId of recipients) {
      const user = this.users.find(u => u.id === userId);
      if (user && this.onNotificationSend) {
        const message = this.formatMessage(config.message, task);
        this.onNotificationSend(userId, message);
        console.log(`📢 Notification sent to ${user.name}: ${message}`);
      }
    }

    return true;
  }

  // Move task to different column
  private async moveTask(config: ActionConfig, task?: Card, boardId?: string): Promise<boolean> {
    if (!task || !config.targetColumnId || !boardId) return false;

    const board = this.boards.find(b => b.id === boardId);
    if (!board) return false;

    // Find source and target columns
    const sourceColumn = board.columns.find(col => col.cards.some(c => c.id === task.id));
    const targetColumn = board.columns.find(col => col.id === config.targetColumnId);

    if (!sourceColumn || !targetColumn || sourceColumn.id === targetColumn.id) {
      return false;
    }

    // Move the task
    sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== task.id);
    targetColumn.cards.push(task);

    // Update boards
    if (this.onBoardsUpdate) {
      this.onBoardsUpdate(this.boards);
    }

    console.log(`📦 Task "${task.title}" moved from "${sourceColumn.title}" to "${targetColumn.title}"`);
    return true;
  }

  // Set task priority
  private async setPriority(config: ActionConfig, task?: Card, boardId?: string): Promise<boolean> {
    if (!task || !config.priority || !boardId) return false;

    task.priority = config.priority;
    this.updateTaskInBoards(task);

    console.log(`🎯 Task "${task.title}" priority set to ${config.priority}`);
    return true;
  }

  // Add comment to task
  private async addComment(config: ActionConfig, task?: Card, boardId?: string): Promise<boolean> {
    if (!task || !config.commentText || !boardId) return false;

    const comment = {
      id: `comment-${Date.now()}`,
      text: this.formatMessage(config.commentText, task),
      author: 'System',
      timestamp: Date.now()
    };

    // Add comment to task activity
    task.activity.push({
      id: `activity-${Date.now()}`,
      type: 'comment',
      message: `System added comment: ${comment.text}`,
      at: Date.now()
    });

    this.updateTaskInBoards(task);

    console.log(`💬 Comment added to task "${task.title}": ${comment.text}`);
    return true;
  }

  // Create new task
  private async createTask(config: ActionConfig, boardId?: string): Promise<boolean> {
    if (!config.taskTitle || !boardId) return false;

    const board = this.boards.find(b => b.id === boardId);
    if (!board) return false;

    // Find the first column (usually "To Do")
    const firstColumn = board.columns[0];
    if (!firstColumn) return false;

    const newTask: Card = {
      id: `task-${Date.now()}`,
      title: config.taskTitle,
      description: config.taskDescription || '',
      priority: config.taskPriority || 'Medium',
      dueDate: '',
      startDate: '',
      labels: [],
      members: [],
      subtasks: [],
      attachments: [],
      comments: [],
      activity: [{
        id: `activity-${Date.now()}`,
        type: 'created',
        message: 'Task created by workflow automation',
        at: Date.now()
      }],
      timeEntries: []
    };

    firstColumn.cards.push(newTask);

    // Update boards
    if (this.onBoardsUpdate) {
      this.onBoardsUpdate(this.boards);
    }

    console.log(`✨ New task created: "${newTask.title}"`);
    return true;
  }

  // Helper: Update task in all boards
  private updateTaskInBoards(updatedTask: Card): void {
    for (const board of this.boards) {
      for (const column of board.columns) {
        const taskIndex = column.cards.findIndex(c => c.id === updatedTask.id);
        if (taskIndex !== -1) {
          column.cards[taskIndex] = updatedTask;
          
          // Update boards
          if (this.onBoardsUpdate) {
            this.onBoardsUpdate(this.boards);
          }
          return;
        }
      }
    }
  }

  // Helper: Format message with task context
  private formatMessage(template: string, task?: Card): string {
    if (!task) return template;

    return template
      .replace('{task.title}', task.title)
      .replace('{task.priority}', task.priority || 'Medium')
      .replace('{task.dueDate}', task.dueDate || 'No due date');
  }

  // Get project managers (admins)
  getProjectManagers(): User[] {
    return this.users.filter(u => u.role === 'admin');
  }

  // Get all users for assignment
  getAllUsers(): User[] {
    return this.users;
  }

  // Check if user exists
  userExists(userId: string): boolean {
    return this.users.some(u => u.id === userId);
  }
}

// Singleton instance
export const workflowExecutionEngine = new WorkflowExecutionEngine();
