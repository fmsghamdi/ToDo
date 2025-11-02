import type { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowExecution, 
  WorkflowStats,
  AutomationRule,
  CustomField,
  TriggerType,
  ActionType
} from '../types/WorkflowTypes';
import type { Card } from '../Types';

export class WorkflowService {
  private workflows: Workflow[] = [];
  private executions: WorkflowExecution[] = [];
  private automationRules: AutomationRule[] = [];
  private customFields: CustomField[] = [];

  constructor() {
    this.loadData();
  }

  // Load data from localStorage
  private loadData(): void {
    const workflows = localStorage.getItem('workflows');
    const executions = localStorage.getItem('workflow_executions');
    const rules = localStorage.getItem('automation_rules');
    const fields = localStorage.getItem('custom_fields');

    if (workflows) this.workflows = JSON.parse(workflows);
    if (executions) this.executions = JSON.parse(executions);
    if (rules) this.automationRules = JSON.parse(rules);
    if (fields) this.customFields = JSON.parse(fields);
  }

  // Save data to localStorage
  private saveData(): void {
    localStorage.setItem('workflows', JSON.stringify(this.workflows));
    localStorage.setItem('workflow_executions', JSON.stringify(this.executions));
    localStorage.setItem('automation_rules', JSON.stringify(this.automationRules));
    localStorage.setItem('custom_fields', JSON.stringify(this.customFields));
  }

  // Workflow Management
  getWorkflows(): Workflow[] {
    return this.workflows;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.find(w => w.id === id);
  }

  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0
    };

    this.workflows.push(newWorkflow);
    this.saveData();
    return newWorkflow;
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): boolean {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.workflows[index] = {
      ...this.workflows[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveData();
    return true;
  }

  deleteWorkflow(id: string): boolean {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.workflows.splice(index, 1);
    this.saveData();
    return true;
  }

  toggleWorkflow(id: string): boolean {
    const workflow = this.getWorkflow(id);
    if (!workflow) return false;

    return this.updateWorkflow(id, { isActive: !workflow.isActive });
  }

  // Workflow Templates
  getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'auto-assign-high-priority',
        name: 'تعيين تلقائي للمهام عالية الأولوية',
        description: 'تعيين المهام عالية الأولوية تلقائياً لمدير المشروع',
        category: 'task_management',
        icon: '🎯',
        workflow: {
          name: 'تعيين تلقائي للمهام عالية الأولوية',
          description: 'عند إنشاء مهمة بأولوية عالية، يتم تعيينها تلقائياً لمدير المشروع',
          isActive: true,
          trigger: {
            type: 'task_created',
            config: {
              priority: 'High'
            }
          },
          conditions: [],
          actions: [
            {
              id: 'action-1',
              type: 'assign_task',
              config: {
                assigneeId: 'project-manager' // يجب تحديد ID المدير
              },
              order: 1
            },
            {
              id: 'action-2',
              type: 'send_notification',
              config: {
                message: 'تم تعيين مهمة عالية الأولوية لك',
                notificationType: 'in_app'
              },
              order: 2
            }
          ],
          lastExecuted: undefined
        }
      },
      {
        id: 'overdue-reminder',
        name: 'تذكير بالمهام المتأخرة',
        description: 'إرسال تذكير يومي بالمهام المتأخرة',
        category: 'notifications',
        icon: '⏰',
        workflow: {
          name: 'تذكير بالمهام المتأخرة',
          description: 'إرسال إشعار يومي للمهام المتأخرة',
          isActive: true,
          trigger: {
            type: 'schedule',
            config: {
              schedule: {
                type: 'daily',
                time: '09:00'
              }
            }
          },
          conditions: [],
          actions: [
            {
              id: 'action-1',
              type: 'send_notification',
              config: {
                message: 'لديك مهام متأخرة تحتاج للمتابعة',
                notificationType: 'email'
              },
              order: 1
            }
          ],
          lastExecuted: undefined
        }
      },
      {
        id: 'auto-move-completed',
        name: 'نقل المهام المكتملة تلقائياً',
        description: 'نقل المهام إلى عمود "مكتمل" عند إكمال جميع المهام الفرعية',
        category: 'task_management',
        icon: '✅',
        workflow: {
          name: 'نقل المهام المكتملة تلقائياً',
          description: 'نقل المهام تلقائياً عند اكتمال جميع المهام الفرعية',
          isActive: true,
          trigger: {
            type: 'task_updated',
            config: {}
          },
          conditions: [
            {
              id: 'condition-1',
              type: 'task_field',
              field: 'subtasks_completed',
              operator: 'equals',
              value: true
            }
          ],
          actions: [
            {
              id: 'action-1',
              type: 'move_task',
              config: {
                targetColumnId: 'done'
              },
              order: 1
            }
          ],
          lastExecuted: undefined
        }
      }
    ];
  }

  createWorkflowFromTemplate(templateId: string, userId: string): Workflow | null {
    const template = this.getWorkflowTemplates().find(t => t.id === templateId);
    if (!template) return null;

    return this.createWorkflow({
      ...template.workflow,
      createdBy: userId
    });
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, triggeredBy: string): Promise<WorkflowExecution> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new Error('Workflow not found or inactive');
    }

    const execution: WorkflowExecution = {
      id: `execution-${Date.now()}`,
      workflowId,
      triggeredBy,
      triggeredAt: Date.now(),
      status: 'running',
      actionsExecuted: 0,
      totalActions: workflow.actions.length,
      logs: []
    };

    this.executions.push(execution);

    try {
      // Check conditions
      const conditionsMet = this.evaluateConditions(workflow.conditions);
      if (!conditionsMet) {
        execution.status = 'completed';
        execution.logs.push({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          level: 'info',
          message: 'Workflow conditions not met, skipping execution'
        });
        this.saveData();
        return execution;
      }

      // Execute actions
      for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
        try {
          await this.executeAction(action);
          execution.actionsExecuted++;
          execution.logs.push({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            level: 'info',
            message: `Action ${action.type} executed successfully`,
            actionId: action.id
          });
        } catch (error) {
          execution.logs.push({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            level: 'error',
            message: `Action ${action.type} failed: ${error}`,
            actionId: action.id
          });
        }
      }

      execution.status = 'completed';
      execution.executionTime = Date.now() - execution.triggeredAt;

      // Update workflow stats
      this.updateWorkflow(workflowId, {
        executionCount: workflow.executionCount + 1,
        lastExecuted: Date.now()
      });

    } catch (error) {
      execution.status = 'failed';
      execution.error = String(error);
      execution.logs.push({
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        level: 'error',
        message: `Workflow execution failed: ${error}`
      });
    }

    this.saveData();
    return execution;
  }

  private evaluateConditions(conditions: unknown[]): boolean {
    if (conditions.length === 0) return true;
    
    // Simple condition evaluation - in real implementation, this would be more sophisticated
    return conditions.every(() => {
      // Placeholder logic - always return true for now
      return true;
    });
  }

  private async executeAction(action: unknown): Promise<void> {
    // Simulate action execution
    const actionObj = action as { type: string; config: unknown };
    console.log(`Executing action: ${actionObj.type}`, actionObj.config);
    
    // In real implementation, this would execute the actual action
    switch (actionObj.type) {
      case 'move_task':
        // Move task logic
        break;
      case 'assign_task':
        // Assign task logic
        break;
      case 'send_notification':
        // Send notification logic
        break;
      // ... other actions
    }
  }

  // Handle task events for workflow triggers
  async handleTaskEvent(event: string, _task: Card, userId: string): Promise<void> {
    const relevantWorkflows = this.workflows.filter(w => 
      w.isActive && w.trigger.type === event
    );

    for (const workflow of relevantWorkflows) {
      try {
        await this.executeWorkflow(workflow.id, userId);
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id}:`, error);
      }
    }
  }

  // Statistics
  getStats(): WorkflowStats {
    const activeWorkflows = this.workflows.filter(w => w.isActive).length;
    const successfulExecutions = this.executions.filter(e => e.status === 'completed').length;
    const failedExecutions = this.executions.filter(e => e.status === 'failed').length;
    
    const executionTimes = this.executions
      .filter(e => e.executionTime)
      .map(e => e.executionTime!);
    
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0;

    // Count trigger and action usage
    const triggerCounts = new Map<TriggerType, number>();
    const actionCounts = new Map<ActionType, number>();

    this.workflows.forEach(w => {
      triggerCounts.set(w.trigger.type, (triggerCounts.get(w.trigger.type) || 0) + 1);
      w.actions.forEach(a => {
        actionCounts.set(a.type, (actionCounts.get(a.type) || 0) + 1);
      });
    });

    const mostUsedTrigger = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'task_created';
    
    const mostUsedAction = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'move_task';

    return {
      totalWorkflows: this.workflows.length,
      activeWorkflows,
      totalExecutions: this.executions.length,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      mostUsedTrigger,
      mostUsedAction
    };
  }

  // Custom Fields Management
  getCustomFields(): CustomField[] {
    return this.customFields;
  }

  createCustomField(field: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'>): CustomField {
    const newField: CustomField = {
      ...field,
      id: `field-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.customFields.push(newField);
    this.saveData();
    return newField;
  }

  // Automation Rules (Simple)
  getAutomationRules(): AutomationRule[] {
    return this.automationRules;
  }

  createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: Date.now(),
      executionCount: 0
    };

    this.automationRules.push(newRule);
    this.saveData();
    return newRule;
  }
}

// Singleton instance
export const workflowService = new WorkflowService();
