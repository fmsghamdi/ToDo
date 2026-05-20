import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/WorkflowService';
import { useLanguage } from '../i18n/useLanguage';
import type { Workflow, WorkflowTemplate } from '../types/WorkflowTypes';

const Workflows: React.FC = () => {
  const { language, t } = useLanguage();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWorkflows(workflowService.getWorkflows());
    setTemplates(workflowService.getWorkflowTemplates());
  };

  const handleToggleWorkflow = async (workflowId: string) => {
    const success = workflowService.toggleWorkflow(workflowId);
    if (success) {
      loadData();
      alert('تم تحديث حالة سير العمل بنجاح');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('هل أنت متأكد من حذف سير العمل هذا؟')) {
      const success = workflowService.deleteWorkflow(workflowId);
      if (success) {
        loadData();
        alert('تم حذف سير العمل بنجاح');
      }
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const workflow = workflowService.createWorkflowFromTemplate(templateId, 'current-user');
    if (workflow) {
      loadData();
      alert('تم إنشاء سير العمل من القالب بنجاح');
      setShowTemplates(false);
    }
  };

  const stats = workflowService.getStats();

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? t.active : t.inactive;
  };

  const getTriggerText = (type: string) => {
    switch (type) {
      case 'task_created': return language === 'ar' ? 'عند إنشاء مهمة' : 'Task Created';
      case 'task_updated': return language === 'ar' ? 'عند تحديث مهمة' : 'Task Updated';
      case 'task_completed': return language === 'ar' ? 'عند إكمال مهمة' : 'Task Completed';
      case 'task_overdue': return language === 'ar' ? 'عند تأخير مهمة' : 'Task Overdue';
      case 'task_assigned': return language === 'ar' ? 'عند تعيين مهمة' : 'Task Assigned';
      case 'due_date_approaching': return language === 'ar' ? 'قبل موعد الاستحقاق' : 'Due Date Approaching';
      case 'schedule': return language === 'ar' ? 'جدولة زمنية' : 'Schedule';
      case 'manual': return language === 'ar' ? 'تشغيل يدوي' : 'Manual';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🔄 {t.workflows}
            </h1>
            <p className="text-gray-600 mt-1">{t.workflowsDesc}</p>
          </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
              >
                📋 {t.workflowTemplates}
              </button>
              <button
                onClick={() => alert('Create custom workflow - coming soon')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
              >
                ➕ {t.createWorkflow}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalWorkflows}</div>
              <div className="text-sm text-gray-600">{t.totalWorkflows || 'Total Workflows'}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activeWorkflows}</div>
              <div className="text-sm text-gray-600">{t.activeWorkflows || 'Active'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalExecutions}</div>
              <div className="text-sm text-gray-600">{t.totalExecutions || 'Total Executions'}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.successfulExecutions}</div>
              <div className="text-sm text-gray-600">{t.successfulExecutions || 'Successful'}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.failedExecutions}</div>
              <div className="text-sm text-gray-600">{t.failedExecutions || 'Failed'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Workflows List */}
        {workflows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noWorkflowsYet || 'No Workflows Yet'}</h3>
            <p className="text-gray-600 mb-6">{t.startWorkflow || 'Start creating a new workflow or use the ready-made templates'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowTemplates(true)}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                📋 {t.useWorkflowTemplate}
              </button>
              <button
                onClick={() => alert('Create custom workflow - coming soon')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                ➕ {t.createWorkflow}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.isActive)}`}>
                        {getStatusText(workflow.isActive)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">المحفز:</span>
                        <span className="ml-2 text-gray-600">{getTriggerText(workflow.trigger.type)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">الإجراءات:</span>
                        <span className="ml-2 text-gray-600">{workflow.actions.length} إجراء</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">التنفيذ:</span>
                        <span className="ml-2 text-gray-600">{workflow.executionCount} مرة</span>
                      </div>
                      {workflow.lastExecuted && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">آخر تنفيذ:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(workflow.lastExecuted).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    onClick={() => handleToggleWorkflow(workflow.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      workflow.isActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {workflow.isActive ? '⏸️ إيقاف' : '▶️ تشغيل'}
                  </button>
                  
                  <button
                    onClick={() => alert('تعديل سير العمل - قريباً')}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    ✏️ تعديل
                  </button>
                  
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">القوالب الجاهزة لسير العمل</h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{template.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">المحفز:</span>
                            <span className="ml-2 text-gray-600">{getTriggerText(template.workflow.trigger.type)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">الإجراءات:</span>
                            <span className="ml-2 text-gray-600">{template.workflow.actions.length} إجراء</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCreateFromTemplate(template.id)}
                          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          استخدام هذا القالب
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflows;
