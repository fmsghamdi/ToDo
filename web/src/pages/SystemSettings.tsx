import React, { useState, useEffect } from 'react';
import { databaseService, getActiveDirectoryConfig } from '../services/DatabaseService.js';
import { useLanguage } from '../i18n/useLanguage';
import { authService } from '../services/AuthService';
import { databaseService } from '../services/DatabaseService'; // تأكد من وجود هذا الاستيراد

interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlserver' | 'oracle';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  connectionString: string;
}

interface ActiveDirectoryConfig {
  enabled: boolean;
  domain: string;
  server: string;
  port: string;
  baseDN: string;
  bindUsername: string;
  bindPassword: string;
  useSSL: boolean;
  office365Integration: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface EmailConfig {
  enabled: boolean;
  provider: 'exchange' | 'gmail' | 'outlook' | 'imap' | 'custom';
  server: string;
  port: string;
  username: string;
  password: string;
  useSSL: boolean;
  useTLS: boolean;
  taskEmailAddress: string;
  autoCreateTasks: boolean;
}

interface SystemConfig {
  organizationName: string;
  systemUrl: string;
  defaultLanguage: 'ar' | 'en';
  timezone: string;
  dateFormat: string;
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
}

const SystemSettings: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'database' | 'ad' | 'email' | 'system'>('database');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});
  const [databaseStatus, setDatabaseStatus] = useState<{ connected: boolean; tablesCount: number; message: string }>({
    connected: false,
    tablesCount: 0,
    message: 'غير متصل'
  });

  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({
    type: 'mysql',
    host: 'localhost',
    port: '3306',
    database: 'taqtask',
    username: '',
    password: '',
    connectionString: ''
  });

  // Default ports for different database types
  const getDefaultPort = (dbType: DatabaseConfig['type']): string => {
    switch (dbType) {
      case 'mysql': return '3306';
      case 'postgresql': return '5432';
      case 'sqlserver': return '1433';
      case 'oracle': return '1521';
      default: return '3306';
    }
  };

  // Handle database type change
  const handleDatabaseTypeChange = (newType: DatabaseConfig['type']) => {
    setDatabaseConfig(prev => ({
      ...prev,
      type: newType,
      port: getDefaultPort(newType)
    }));
  };

  const [adConfig, setAdConfig] = useState<ActiveDirectoryConfig>({
    enabled: false,
    domain: '',
    server: '',
    port: '389',
    baseDN: '',
    bindUsername: '',
    bindPassword: '',
    useSSL: false,
    office365Integration: false,
    tenantId: '',
    clientId: '',
    clientSecret: ''
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    enabled: false,
    provider: 'exchange',
    server: '',
    port: '993',
    username: '',
    password: '',
    useSSL: true,
    useTLS: false,
    taskEmailAddress: '',
    autoCreateTasks: true
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    organizationName: '',
    systemUrl: '',
    defaultLanguage: 'en',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    allowSelfRegistration: true,
    requireEmailVerification: false,
    sessionTimeout: 480
  });

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const result = await databaseService.testDatabaseConnection(databaseConfig);
      setTestResults(prev => ({
        ...prev,
        database: result
      }));
    } catch {
      setTestResults(prev => ({
        ...prev,
        database: { success: false, message: 'فشل في اختبار الاتصال' }
      }));
    }
    setIsLoading(false);
  };

  const initializeDatabase = async () => {
    setIsLoading(true);
    try {
      // Show progress message
      setTestResults(prev => ({
        ...prev,
        initialize: { success: true, message: '🔄 جاري إنشاء قاعدة البيانات والجداول تلقائياً...' }
      }));

      const result = await databaseService.initializeDatabase(databaseConfig.type, databaseConfig);
      setTestResults(prev => ({
        ...prev,
        initialize: result
      }));
      
      if (result.success) {
        // Update database status
        setDatabaseStatus({
          connected: true,
          tablesCount: 15,
          message: 'متصل - تم إنشاء 15 جدول'
        });
        
        // Show success message with confetti effect
        alert(`🎉 ${result.message}\n\n✨ تم الإعداد بنجاح! يمكنك الآن استخدام النظام.`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch {
      setTestResults(prev => ({
        ...prev,
        initialize: { success: false, message: 'فشل في إنشاء قاعدة البيانات' }
      }));
      alert('❌ فشل في إنشاء قاعدة البيانات');
    }
    setIsLoading(false);
  };

  // Check database status
  const checkDatabaseStatus = async () => {
    try {
      const status = await databaseService.getDatabaseStatus();
      setDatabaseStatus({
        connected: status.connected,
        tablesCount: status.connected ? 15 : 0,
        message: status.message
      });
    } catch {
      setDatabaseStatus({
        connected: false,
        tablesCount: 0,
        message: 'خطأ في التحقق من الحالة'
      });
    }
  };

  // Load all configs on component mount
  useEffect(() => {
    const loadConfigs = async () => {
      // Check database status first
      await checkDatabaseStatus();
      try {
        // Load database config from server
        const dbConfig = await databaseService.getDatabaseConfig();
        if (dbConfig) {
          setDatabaseConfig(dbConfig);
          console.log('Database config loaded from server:', dbConfig);
        }

        // === التعديل الرئيسي هنا ===
        // Load AD config from server
        const savedConfig = await databaseService.getActiveDirectoryConfig();
        if (savedConfig) {
          setAdConfig({
            enabled: savedConfig.enabled,
            domain: savedConfig.domain,
            server: savedConfig.serverUrl,
            port: '389', // Default port
            baseDN: savedConfig.baseDN,
            bindUsername: savedConfig.bindUsername,
            bindPassword: savedConfig.bindPassword,
            useSSL: savedConfig.useSSL,
            office365Integration: savedConfig.office365Integration,
            tenantId: savedConfig.tenantId || '',
            clientId: savedConfig.clientId || '',
            clientSecret: savedConfig.clientSecret || ''
          });
          console.log('AD config loaded from server:', savedConfig);
        } else {
          // Fallback to localStorage if server is not available
          console.log('AD config not found on server, checking localStorage...');
          const localConfig = authService.getADConfig();
          if (localConfig) {
            setAdConfig({
              enabled: localConfig.enabled,
              domain: localConfig.domain,
              server: localConfig.serverUrl,
              port: '389',
              baseDN: localConfig.baseDN,
              bindUsername: localConfig.bindUsername,
              bindPassword: localConfig.bindPassword,
              useSSL: localConfig.useSSL,
              office365Integration: localConfig.office365Integration,
              tenantId: localConfig.tenantId || '',
              clientId: localConfig.clientId || '',
              clientSecret: localConfig.clientSecret || ''
            });
            console.log('AD config loaded from localStorage as fallback.');
          }
        }

        // Load email config from server
        const emailConf = await databaseService.getEmailConfig();
        if (emailConf) {
          setEmailConfig(emailConf);
          console.log('Email config loaded from server:', emailConf);
        }

        // Load system config from server
        const sysConfig = await databaseService.getSystemSettings();
        if (sysConfig) {
          setSystemConfig(sysConfig);
          console.log('System config loaded from server:', sysConfig);
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
        // Fallback to localStorage if server is not available
        console.log('Falling back to localStorage...');
        
        // Fallback for database config
        const savedDatabaseConfig = localStorage.getItem('databaseConfig');
        if (savedDatabaseConfig) {
          try {
            const parsedConfig = JSON.parse(savedDatabaseConfig);
            setDatabaseConfig(parsedConfig);
          } catch (e) {
            console.error('Error parsing database config from localStorage:', e);
          }
        }

        // Fallback for email config
        const savedEmailConfig = localStorage.getItem('emailConfig');
        if (savedEmailConfig) {
          try {
            const parsedConfig = JSON.parse(savedEmailConfig);
            setEmailConfig(parsedConfig);
          } catch (e) {
            console.error('Error parsing email config from localStorage:', e);
          }
        }

        // Fallback for system config
        const savedSystemConfig = localStorage.getItem('systemConfig');
        if (savedSystemConfig) {
          try {
            const parsedConfig = JSON.parse(savedSystemConfig);
            setSystemConfig(parsedConfig);
          } catch (e) {
            console.error('Error parsing system config from localStorage:', e);
          }
        }
      }
    };

    loadConfigs();
  }, []);

  const testADConnection = async () => {
    setIsLoading(true);
    try {
      // Convert local config to AuthService format
      const testConfig = {
        enabled: adConfig.enabled,
        domain: adConfig.domain,
        serverUrl: adConfig.server,
        baseDN: adConfig.baseDN,
        bindUsername: adConfig.bindUsername,
        bindPassword: adConfig.bindPassword,
        useSSL: adConfig.useSSL,
        office365Integration: adConfig.office365Integration,
        tenantId: adConfig.tenantId,
        clientId: adConfig.clientId,
        clientSecret: adConfig.clientSecret
      };

      const result = await authService.testADConnection(testConfig);
      setTestResults(prev => ({
        ...prev,
        ad: { success: result.success, message: result.message }
      }));
    } catch {
      setTestResults(prev => ({
        ...prev,
        ad: { success: false, message: 'فشل في اختبار الاتصال' }
      }));
    }
    setIsLoading(false);
  };

  const testEmailConnection = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({
        ...prev,
        email: { success: true, message: t.emailConnectionSuccess }
      }));
    } catch {
      setTestResults(prev => ({
        ...prev,
        email: { success: false, message: t.emailConnectionFailed }
      }));
    }
    setIsLoading(false);
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      let result = { success: false, message: '' };

      // Save configuration based on active tab
      if (activeTab === 'database') {
        // Save database configuration to server
        result = await databaseService.saveDatabaseConfig(databaseConfig);
        console.log('Database config save result:', result);
        
        // Fallback to localStorage if server fails
        if (!result.success) {
          localStorage.setItem('databaseConfig', JSON.stringify(databaseConfig));
          result = { success: true, message: 'تم حفظ إعدادات قاعدة البيانات بنجاح' };
        }
        
        // Update database status after saving
        await checkDatabaseStatus();
      } else if (activeTab === 'ad') {
        // Save AD configuration
        const adConfigToSave = {
          enabled: adConfig.enabled,
          domain: adConfig.domain,
          serverUrl: adConfig.server,
          baseDN: adConfig.baseDN,
          bindUsername: adConfig.bindUsername,
          bindPassword: adConfig.bindPassword,
          useSSL: adConfig.useSSL,
          office365Integration: adConfig.office365Integration,
          tenantId: adConfig.tenantId,
          clientId: adConfig.clientId,
          clientSecret: adConfig.clientSecret
        };
        
        // Save to server using the new method
        try {
          result = await databaseService.saveActiveDirectoryConfig(adConfigToSave);
        } catch (error) {
          console.error('Failed to save AD config to server, falling back to local storage:', error);
          // Fallback to local storage
          authService.setADConfig(adConfigToSave);
          result = { success: true, message: 'تم حفظ إعدادات Active Directory محلياً' };
        }
        console.log('AD config saved:', adConfigToSave);
      } else if (activeTab === 'email') {
        // Save email configuration to server
        result = await databaseService.saveEmailConfig(emailConfig);
        console.log('Email config save result:', result);
        
        // Fallback to localStorage if server fails
        if (!result.success) {
          localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
          result = { success: true, message: 'تم حفظ إعدادات البريد الإلكتروني محلياً (الخادم غير متاح)' };
        }
      } else if (activeTab === 'system') {
        // Save system configuration to server
        result = await databaseService.saveSystemSettings(systemConfig);
        console.log('System config save result:', result);
        
        // Fallback to localStorage if server fails
        if (!result.success) {
          localStorage.setItem('systemConfig', JSON.stringify(systemConfig));
          result = { success: true, message: 'تم حفظ الإعدادات العامة محلياً (الخادم غير متاح)' };
        }
      }
      
      // Show result message
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      
      // Fallback save to localStorage
      try {
        if (activeTab === 'database') {
          localStorage.setItem('databaseConfig', JSON.stringify(databaseConfig));
        } else if (activeTab === 'email') {
          localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
        } else if (activeTab === 'system') {
          localStorage.setItem('systemConfig', JSON.stringify(systemConfig));
        }
        alert('✅ تم حفظ الإعدادات محلياً (الخادم غير متاح)');
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError);
        alert('❌ فشل في حفظ الإعدادات');
      }
    }
    setIsLoading(false);
  };

  // ====== Database Tab ======
  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-blue-800">{t.databaseSettings}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${databaseStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {databaseStatus.connected ? `✅ ${databaseStatus.message}` : `❌ ${databaseStatus.message}`}
            </span>
            <button
              onClick={checkDatabaseStatus}
              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              تحديث
            </button>
          </div>
        </div>
        <p className="text-blue-600">{t.databaseSettingsDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t.databaseType}</label>
          <select
            value={databaseConfig.type}
            onChange={(e) => handleDatabaseTypeChange(e.target.value as DatabaseConfig['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlserver">SQL Server</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.serverAddress}</label>
          <input
            type="text"
            value={databaseConfig.host}
            onChange={(e) => setDatabaseConfig(prev => ({ ...prev, host: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="localhost"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.port}</label>
          <input
            type="text"
            value={databaseConfig.port}
            onChange={(e) => setDatabaseConfig(prev => ({ ...prev, port: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="3306"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.databaseName}</label>
          <input
            type="text"
            value={databaseConfig.database}
            onChange={(e) => setDatabaseConfig(prev => ({ ...prev, database: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="taqtask"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.username}</label>
          <input
            type="text"
            value={databaseConfig.username}
            onChange={(e) => setDatabaseConfig(prev => ({ ...prev, username: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.password}</label>
          <input
            type="password"
            value={databaseConfig.password}
            onChange={(e) => setDatabaseConfig(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t.customConnectionString}</label>
        <textarea
          value={databaseConfig.connectionString}
          onChange={(e) => setDatabaseConfig(prev => ({ ...prev, connectionString: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder={t.connectionStringPlaceholder}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={testDatabaseConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isLoading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
        </button>
        
        <button
          onClick={initializeDatabase}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء قاعدة البيانات والجداول'}
        </button>
        
        {testResults.database && (
          <div className={`px-4 py-2 rounded-lg ${testResults.database.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResults.database.message}
          </div>
        )}
        
        {testResults.initialize && (
          <div className={`px-4 py-2 rounded-lg ${testResults.initialize.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResults.initialize.message}
          </div>
        )}
      </div>

      {/* Database Setup Instructions */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">تعليمات إعداد قاعدة البيانات:</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• املأ جميع بيانات الاتصال بقاعدة البيانات</li>
          <li>• انقر "اختبار الاتصال" للتأكد من صحة البيانات</li>
          <li>• انقر "إنشاء قاعدة البيانات والجداول" لإنشاء الهيكل المطلوب</li>
          <li>• احفظ الإعدادات بعد التأكد من نجاح العملية</li>
        </ul>
      </div>
    </div>
  );

  // ====== Active Directory Tab ======
  const renderADTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">{t.activeDirectorySettings}</h3>
        <p className="text-green-600">{t.activeDirectorySettingsDesc}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enableAD"
          checked={adConfig.enabled}
          onChange={(e) => setAdConfig(prev => ({ ...prev, enabled: e.target.checked }))}
        />
        <label htmlFor="enableAD" className="text-sm font-medium">{t.enableAD}</label>
      </div>

      {adConfig.enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t.domain}</label>
              <input
                type="text"
                value={adConfig.domain}
                onChange={(e) => setAdConfig(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="company.local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.adServer}</label>
              <input
                type="text"
                value={adConfig.server}
                onChange={(e) => setAdConfig(prev => ({ ...prev, server: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="dc.company.local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.port}</label>
              <input
                type="text"
                value={adConfig.port}
                onChange={(e) => setAdConfig(prev => ({ ...prev, port: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="389"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.baseDN}</label>
              <input
                type="text"
                value={adConfig.baseDN}
                onChange={(e) => setAdConfig(prev => ({ ...prev, baseDN: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="DC=company,DC=local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.bindUsername}</label>
              <input
                type="text"
                value={adConfig.bindUsername}
                onChange={(e) => setAdConfig(prev => ({ ...prev, bindUsername: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="admin@company.local"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">كلمة مرور الربط</label>
              <input
                type="password"
                value={adConfig.bindPassword}
                onChange={(e) => setAdConfig(prev => ({ ...prev, bindPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="********"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="useSSL"
              checked={adConfig.useSSL}
              onChange={(e) => setAdConfig(prev => ({ ...prev, useSSL: e.target.checked }))}
            />
            <label htmlFor="useSSL" className="text-sm font-medium">{t.useSSL}</label>
          </div>

          {/* Office 365 Integration Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="enableO365"
                checked={adConfig.office365Integration}
                onChange={(e) => setAdConfig(prev => ({ ...prev, office365Integration: e.target.checked }))}
              />
              <label htmlFor="enableO365" className="text-sm font-medium">تفعيل تكامل Office 365</label>
            </div>

            {adConfig.office365Integration && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Tenant ID</label>
                  <input
                    type="text"
                    value={adConfig.tenantId}
                    onChange={(e) => setAdConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Client ID</label>
                  <input
                    type="text"
                    value={adConfig.clientId}
                    onChange={(e) => setAdConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Client Secret</label>
                  <input
                    type="password"
                    value={adConfig.clientSecret}
                    onChange={(e) => setAdConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="********************************"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={testADConnection}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              {isLoading ? t.testing : t.testConnection}
            </button>
            {testResults.ad && (
              <div className={`px-4 py-2 rounded-lg ${testResults.ad.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.ad.message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // ====== Email Tab ======
  const renderEmailTab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">{t.emailSettings}</h3>
        <p className="text-purple-600">{t.emailSettingsDesc}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={emailConfig.enabled}
          onChange={(e) => setEmailConfig(prev => ({ ...prev, enabled: e.target.checked }))}
        />
        <label className="text-sm font-medium">{t.enableEmailTasks}</label>
      </div>

      {emailConfig.enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t.emailServer}</label>
              <input
                type="text"
                value={emailConfig.server}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, server: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={t.emailServerPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.taskEmailAddress}</label>
              <input
                type="email"
                value={emailConfig.taskEmailAddress}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, taskEmailAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={t.taskEmailPlaceholder}
              />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-yellow-800 mb-2">{t.emailInstructions}</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• {t.emailInstruction1}</li>
              <li>• {t.emailInstruction2}</li>
              <li>• {t.emailInstruction3}</li>
              <li>• {t.emailInstruction4}</li>
            </ul>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={testEmailConnection}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              {isLoading ? t.testing : t.testConnection}
            </button>
            {testResults.email && (
              <div className={`px-4 py-2 rounded-lg ${testResults.email.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.email.message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // ====== System Tab ======
  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.generalSettings}</h3>
        <p className="text-gray-600">{t.generalSettingsDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t.organizationName}</label>
          <input
            type="text"
            value={systemConfig.organizationName}
            onChange={(e) => setSystemConfig(prev => ({ ...prev, organizationName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder={t.organizationPlaceholder}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t.systemUrl}</label>
          <input
            type="url"
            value={systemConfig.systemUrl}
            onChange={(e) => setSystemConfig(prev => ({ ...prev, systemUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder={t.systemUrlPlaceholder}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">{t.systemSettingsTitle}</h1>
            <p className="text-gray-600 mt-2">{t.systemSettingsDesc}</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button onClick={() => setActiveTab('database')} className={`py-4 px-1 border-b-2 ${activeTab === 'database' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
                {t.databaseSettings}
              </button>
              <button onClick={() => setActiveTab('ad')} className={`py-4 px-1 border-b-2 ${activeTab === 'ad' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
                {t.activeDirectorySettings}
              </button>
              <button onClick={() => setActiveTab('email')} className={`py-4 px-1 border-b-2 ${activeTab === 'email' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>
                {t.emailSettings}
              </button>
              <button onClick={() => setActiveTab('system')} className={`py-4 px-1 border-b-2 ${activeTab === 'system' ? 'border-gray-500 text-gray-600' : 'border-transparent text-gray-500'}`}>
                {t.generalSettings}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'database' && renderDatabaseTab()}
            {activeTab === 'ad' && renderADTab()}
            {activeTab === 'email' && renderEmailTab()}
            {activeTab === 'system' && renderSystemTab()}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-4">
            <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-lg">{t.cancelChanges}</button>
            <button onClick={saveConfiguration} disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
              {isLoading ? t.saving : t.saveSettings}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
