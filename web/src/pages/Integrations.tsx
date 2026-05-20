import React, { useState, useEffect } from 'react';
import { integrationService } from '../services/IntegrationService';
import { useLanguage } from '../i18n/useLanguage';
import type { Integration, IntegrationType, IntegrationConfig } from '../types/IntegrationTypes';
import type { Translation } from '../i18n/translations';

const Integrations: React.FC = () => {
  const { language, t } = useLanguage();
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
      case 'connected': return t.connected;
      case 'disconnected': return t.disconnected;
      case 'error': return t.error;
      default: return status;
    }
  };

  const stats = integrationService.getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🔌 {t.integrations}
            </h1>
            <p className="text-gray-600 mt-1">{t.integrationsDesc}</p>
          </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              ➕ {t.addIntegration || 'Add New Integration'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalIntegrations}</div>
              <div className="text-sm text-gray-600">{t.totalIntegrations || 'Total Integrations'}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activeIntegrations}</div>
              <div className="text-sm text-gray-600">{t.activeIntegrations || 'Active Integrations'}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.syncErrors}</div>
              <div className="text-sm text-gray-600">{t.syncErrors || 'Sync Errors'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : t.none || 'None'}
              </div>
              <div className="text-sm text-gray-600">{t.lastSync || 'Last Sync'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Integrations Grid */}
        {integrations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noIntegrationsYet || 'No Integrations'}</h3>
            <p className="text-gray-600 mb-6">{t.startIntegration || 'Start adding a new integration to connect ToDoOS with external services'}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t.addIntegration || 'Add New Integration'}
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
                    <strong>{t.createdAt || 'Created At'}:</strong> {new Date(integration.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                  {integration.lastSync && (
                    <div className="text-sm text-gray-600">
                      <strong>{t.lastSync || 'Last Sync'}:</strong> {new Date(integration.lastSync).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncingId === integration.id || integration.status !== 'connected'}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {syncingId === integration.id ? '🔄 ' + t.loading : '🔄 ' + (t.sync || 'Sync')}
                  </button>
                  
                  <button
                    onClick={() => setSelectedIntegration(integration)}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    ⚙️ {t.settings || 'Settings'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(integration.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ {t.delete || 'Delete'}
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
          language={language}
          t={t}
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
          language={language}
          t={t}
        />
      )}
    </div>
  );
};

// Add Integration Modal Component
const AddIntegrationModal: React.FC<{
  onClose: () => void;
  onAdd: () => void;
  language: string;
  t: Translation;
}> = ({ onClose, onAdd, language, t }) => {
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رمز الوصول (Access Token)' : 'Access Token'}
              </label>
              <input
                type="text"
                placeholder="Google Calendar Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  googleCalendar: { 
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'معرف التقويم' : 'Calendar ID'}
              </label>
              <input
                type="text"
                placeholder="primary"
                defaultValue="primary"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  googleCalendar: { 
                    ...config.googleCalendar,
                    accessToken: config.googleCalendar?.accessToken || '',
                    refreshToken: '',
                    calendarId: e.target.value,
                    syncTasks: true,
                    syncDeadlines: true,
                    createEvents: true
                  }
                })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المهام' : 'Sync Tasks'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المواعيد النهائية' : 'Sync Deadlines'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إنشاء أحداث تلقائياً' : 'Create Events Automatically'}</span>
              </label>
            </div>
          </div>
        );

      case 'outlook_calendar':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رمز الوصول (Access Token)' : 'Access Token'}
              </label>
              <input
                type="text"
                placeholder="Outlook Calendar Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  outlookCalendar: { 
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                placeholder="user@outlook.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المهام' : 'Sync Tasks'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المواعيد النهائية' : 'Sync Deadlines'}</span>
              </label>
            </div>
          </div>
        );

      case 'google_drive':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رمز الوصول (Access Token)' : 'Access Token'}
              </label>
              <input
                type="text"
                placeholder="Google Drive Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  googleDrive: {
                    accessToken: e.target.value,
                    refreshToken: '',
                    folderId: 'root',
                    autoUpload: true,
                    syncAttachments: true
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'معرف المجلد' : 'Folder ID'}
              </label>
              <input
                type="text"
                placeholder="root"
                defaultValue="root"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'رفع تلقائي' : 'Auto Upload'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المرفقات' : 'Sync Attachments'}</span>
              </label>
            </div>
          </div>
        );

      case 'dropbox':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رمز الوصول (Access Token)' : 'Access Token'}
              </label>
              <input
                type="text"
                placeholder="Dropbox Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  dropbox: {
                    accessToken: e.target.value,
                    folderPath: '/ToDoOS',
                    autoUpload: true,
                    syncAttachments: true
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'مسار المجلد' : 'Folder Path'}
              </label>
              <input
                type="text"
                placeholder="/ToDoOS"
                defaultValue="/ToDoOS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'رفع تلقائي' : 'Auto Upload'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المرفقات' : 'Sync Attachments'}</span>
              </label>
            </div>
          </div>
        );

      case 'onedrive':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رمز الوصول (Access Token)' : 'Access Token'}
              </label>
              <input
                type="text"
                placeholder="OneDrive Access Token"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  onedrive: {
                    accessToken: e.target.value,
                    refreshToken: '',
                    folderPath: '/ToDoOS',
                    autoUpload: true,
                    syncAttachments: true
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'مسار المجلد' : 'Folder Path'}
              </label>
              <input
                type="text"
                placeholder="/ToDoOS"
                defaultValue="/ToDoOS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'رفع تلقائي' : 'Auto Upload'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'مزامنة المرفقات' : 'Sync Attachments'}</span>
              </label>
            </div>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رابط Webhook' : 'Webhook URL'}
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'القناة' : 'Channel'}
              </label>
              <input
                type="text"
                placeholder="#general"
                defaultValue="#general"
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
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند إنشاء مهمة' : 'Notify on Task Create'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند إكمال مهمة' : 'Notify on Task Complete'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند اقتراب الموعد النهائي' : 'Notify on Deadline'}</span>
              </label>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'خادم SMTP' : 'SMTP Server'}
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  email: {
                    smtpServer: e.target.value,
                    smtpHost: e.target.value,
                    smtpPort: 587,
                    username: '',
                    password: '',
                    fromEmail: '',
                    fromName: 'ToDoOS',
                    useTLS: true,
                    createTasksFromEmail: false,
                    emailNotifications: true,
                    notifyOnTaskCreate: true,
                    notifyOnTaskComplete: true,
                    notifyOnDeadline: true
                  }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المنفذ' : 'Port'}
                </label>
                <input
                  type="number"
                  placeholder="587"
                  defaultValue="587"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 h-full pt-8">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{language === 'ar' ? 'استخدام TLS' : 'Use TLS'}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                type="text"
                placeholder="user@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني المرسل' : 'From Email'}
              </label>
              <input
                type="email"
                placeholder="notifications@todoos.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند إنشاء مهمة' : 'Notify on Task Create'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند إكمال مهمة' : 'Notify on Task Complete'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">{language === 'ar' ? 'إشعار عند اقتراب الموعد النهائي' : 'Notify on Deadline'}</span>
              </label>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'رابط Webhook' : 'Webhook URL'}
              </label>
              <input
                type="url"
                placeholder="https://your-webhook-url.com/endpoint"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  webhook: {
                    url: e.target.value,
                    secret: '',
                    events: ['task_created', 'task_completed']
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المفتاح السري (اختياري)' : 'Secret Key (Optional)'}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => setConfig({
                  ...config,
                  webhook: {
                    url: config.webhook?.url || '',
                    secret: e.target.value,
                    events: config.webhook?.events || ['task_created', 'task_completed']
                  }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الأحداث' : 'Events'}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{language === 'ar' ? 'إنشاء مهمة' : 'Task Created'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{language === 'ar' ? 'إكمال مهمة' : 'Task Completed'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{language === 'ar' ? 'تحديث مهمة' : 'Task Updated'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{language === 'ar' ? 'حذف مهمة' : 'Task Deleted'}</span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.addIntegration || 'Add New Integration'}</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-3">{t.integrationType || 'Integration Type'}</label>
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
                        <div className="text-xs text-gray-600">{language === 'ar' ? type.description : type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.integrationName || 'Integration Name'}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: تقويم العمل الرئيسي' : 'e.g., Main Work Calendar'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            {/* Configuration Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t.integrationSettings || 'Integration Settings'}</label>
              {renderConfigForm()}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t.loading + '...' : t.add || 'Add'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.cancel || 'Cancel'}
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
  language: string;
  t: Translation;
}> = ({ integration, onClose, language, t }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.integrationSettings || 'Integration Settings'}</h2>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.integrationSettings || 'Integration Settings'}</h3>
            <p className="text-gray-600 mb-6">
              {language === 'ar' 
                ? `إعدادات تفصيلية لتكامل ${integration.name} ستكون متاحة قريباً`
                : `Detailed settings for ${integration.name} will be available soon`
              }
            </p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t.close || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
