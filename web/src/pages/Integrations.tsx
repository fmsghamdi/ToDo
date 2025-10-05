import React, { useState, useEffect } from 'react';
import { integrationService } from '../services/IntegrationService';
import type { Integration, IntegrationType, IntegrationConfig } from '../types/IntegrationTypes';

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Load integrations on component mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    setIntegrations(integrationService.getIntegrations());
  };

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId);
    try {
      const result = await integrationService.syncIntegration(integrationId);
      if (result.success) {
        alert('تم المزامنة بنجاح!');
      } else {
        alert(`فشل في المزامنة: ${result.message}`);
      }
    } catch {
      alert('حدث خطأ أثناء المزامنة');
    } finally {
      setSyncingId(null);
      loadIntegrations();
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التكامل؟')) {
      const success = integrationService.deleteIntegration(integrationId);
      if (success) {
        alert('تم حذف التكامل بنجاح');
        loadIntegrations();
      } else {
        alert('فشل في حذف التكامل');
      }
    }
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case 'google_calendar': return '📅';
      case 'outlook_calendar': return '📆';
      case 'google_drive': return '💾';
      case 'dropbox': return '📦';
      case 'onedrive': return '☁️';
      case 'slack': return '💬';
      case 'email': return '📧';
      case 'webhook': return '🔗';
      default: return '🔌';
    }
  };

  const getIntegrationName = (type: IntegrationType) => {
    switch (type) {
      case 'google_calendar': return 'Google Calendar';
      case 'outlook_calendar': return 'Outlook Calendar';
      case 'google_drive': return 'Google Drive';
      case 'dropbox': return 'Dropbox';
      case 'onedrive': return 'OneDrive';
      case 'slack': return 'Slack';
      case 'email': return 'Email';
      case 'webhook': return 'Webhook';
      default: return type;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'متصل';
      case 'disconnected': return 'غير متصل';
      case 'error': return 'خطأ';
      default: return status;
    }
  };

  const stats = integrationService.getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🔌 التكاملات الخارجية
              </h1>
              <p className="text-gray-600 mt-1">ربط ToDoOS مع الأنظمة والخدمات الخارجية</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              ➕ إضافة تكامل جديد
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalIntegrations}</div>
              <div className="text-sm text-gray-600">إجمالي التكاملات</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activeIntegrations}</div>
              <div className="text-sm text-gray-600">التكاملات النشطة</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.syncErrors}</div>
              <div className="text-sm text-gray-600">أخطاء المزامنة</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleDateString('ar-SA') : 'لا يوجد'}
              </div>
              <div className="text-sm text-gray-600">آخر مزامنة</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Integrations Grid */}
        {integrations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد تكاملات</h3>
            <p className="text-gray-600 mb-6">ابدأ بإضافة تكامل جديد لربط ToDoOS مع الخدمات الخارجية</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              إضافة تكامل جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getIntegrationIcon(integration.type)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-600">{getIntegrationName(integration.type)}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {getStatusText(integration.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>تم الإنشاء:</strong> {new Date(integration.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                  {integration.lastSync && (
                    <div className="text-sm text-gray-600">
                      <strong>آخر مزامنة:</strong> {new Date(integration.lastSync).toLocaleString('ar-SA')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncingId === integration.id || integration.status !== 'connected'}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {syncingId === integration.id ? '🔄 جاري المزامنة...' : '🔄 مزامنة'}
                  </button>
                  
                  <button
                    onClick={() => setSelectedIntegration(integration)}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    ⚙️ إعدادات
                  </button>
                  
                  <button
                    onClick={() => handleDelete(integration.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <AddIntegrationModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            loadIntegrations();
          }}
        />
      )}

      {/* Integration Settings Modal */}
      {selectedIntegration && (
        <IntegrationSettingsModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onUpdate={() => {
            setSelectedIntegration(null);
            loadIntegrations();
          }}
        />
      )}
    </div>
  );
};

// Add Integration Modal Component
const AddIntegrationModal: React.FC<{
  onClose: () => void;
  onAdd: () => void;
}> = ({ onClose, onAdd }) => {
  const [selectedType, setSelectedType] = useState<IntegrationType>('google_calendar');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Partial<IntegrationConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const integrationTypes: { type: IntegrationType; name: string; icon: string; description: string }[] = [
    { type: 'google_calendar', name: 'Google Calendar', icon: '📅', description: 'مزامنة المهام مع تقويم Google' },
    { type: 'outlook_calendar', name: 'Outlook Calendar', icon: '📆', description: 'مزامنة المهام مع تقويم Outlook' },
    { type: 'google_drive', name: 'Google Drive', icon: '💾', description: 'رفع الملفات إلى Google Drive' },
    { type: 'dropbox', name: 'Dropbox', icon: '📦', description: 'رفع الملفات إلى Dropbox' },
    { type: 'onedrive', name: 'OneDrive', icon: '☁️', description: 'رفع الملفات إلى OneDrive' },
    { type: 'slack', name: 'Slack', icon: '💬', description: 'إرسال إشعارات إلى Slack' },
    { type: 'email', name: 'Email', icon: '📧', description: 'إرسال إشعارات بالبريد الإلكتروني' },
    { type: 'webhook', name: 'Webhook', icon: '🔗', description: 'إرسال البيانات إلى URL خارجي' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم التكامل');
      return;
    }

    setIsSubmitting(true);
    try {
      await integrationService.addIntegration(name.trim(), selectedType, config);
      alert('تم إضافة التكامل بنجاح!');
      onAdd();
    } catch {
      alert('فشل في إضافة التكامل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderConfigForm = () => {
    switch (selectedType) {
      case 'google_calendar':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="text"
                placeholder="Google Calendar Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  googleCalendar: { 
                    ...config.googleCalendar,
                    accessToken: e.target.value,
                    refreshToken: '',
                    calendarId: 'primary',
                    syncTasks: true,
                    syncDeadlines: true,
                    createEvents: true
                  }
                })}
              />
            </div>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  slack: {
                    webhookUrl: e.target.value,
                    channel: '#general',
                    notifyOnTaskCreate: true,
                    notifyOnTaskComplete: true,
                    notifyOnDeadline: true
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <input
                type="text"
                placeholder="#general"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  slack: {
                    webhookUrl: config.slack?.webhookUrl || '',
                    channel: e.target.value,
                    notifyOnTaskCreate: true,
                    notifyOnTaskComplete: true,
                    notifyOnDeadline: true
                  }
                })}
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                placeholder="https://your-webhook-url.com/endpoint"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  webhook: {
                    ...config.webhook,
                    url: e.target.value,
                    secret: '',
                    events: ['task_created', 'task_completed']
                  }
                })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>إعدادات هذا النوع من التكامل ستكون متاحة قريباً</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">إضافة تكامل جديد</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Integration Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">نوع التكامل</label>
              <div className="grid grid-cols-2 gap-3">
                {integrationTypes.map((type) => (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setSelectedType(type.type)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedType === type.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم التكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: تقويم العمل الرئيسي"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            {/* Configuration Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">إعدادات التكامل</label>
              {renderConfigForm()}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة التكامل'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Integration Settings Modal Component
const IntegrationSettingsModal: React.FC<{
  integration: Integration;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ integration, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">إعدادات التكامل</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">إعدادات التكامل</h3>
            <p className="text-gray-600 mb-6">
              إعدادات تفصيلية لتكامل {integration.name} ستكون متاحة قريباً
            </p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
