import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { hybridService } from '../services/HybridService';

interface DataStorageIndicatorProps {
  className?: string;
}

const DataStorageIndicator: React.FC<DataStorageIndicatorProps> = ({ className = '' }) => {
  const { language } = useLanguage();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'local' | 'disconnected' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    checkConnectionStatus();
    // Check every 30 seconds
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await hybridService.getConnectionStatus();
      setConnectionStatus(status);
      
      if (status === 'connected') {
        setLastSync(new Date());
      }
    } catch {
      // Fallback to disconnected
      setConnectionStatus('disconnected');
    }
  };

  const getIndicatorContent = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: '🗄️',
          text: 'Database Connected',
          textAr: 'متصل بقاعدة البيانات',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          description: 'Connected to API server - Data synced with SQL database',
          descriptionAr: 'متصل بالخادم - البيانات محفوظة في قاعدة البيانات SQL'
        };
      case 'local':
        return {
          icon: '💾',
          text: 'Local Storage',
          textAr: 'حفظ محلي',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          description: 'API server offline - Data stored locally in browser',
          descriptionAr: 'الخادم غير متصل - البيانات محفوظة محلياً في المتصفح'
        };
      case 'disconnected':
        return {
          icon: '❌',
          text: 'Disconnected',
          textAr: 'غير متصل',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          description: 'No connection - No data available',
          descriptionAr: 'لا يوجد اتصال - لا توجد بيانات متاحة'
        };
      case 'checking':
        return {
          icon: '🔄',
          text: 'Checking...',
          textAr: 'جاري التحقق...',
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          description: 'Checking connection status',
          descriptionAr: 'جاري التحقق من حالة الاتصال'
        };
    }
  };

  const indicator = getIndicatorContent();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${indicator.bgColor} border border-gray-200`}>
        <div className={`w-2 h-2 rounded-full ${indicator.color} ${connectionStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
        <span className="text-sm">{indicator.icon}</span>
        <span className={`text-sm font-medium ${indicator.textColor}`}>
          {language === 'ar' ? indicator.textAr : indicator.text}
        </span>
        {lastSync && connectionStatus === 'connected' && (
          <span className="text-xs text-gray-500">
            ({lastSync.toLocaleTimeString()})
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="relative group">
        <button className="text-gray-400 hover:text-gray-600 text-sm">ℹ️</button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
          {language === 'ar' ? indicator.descriptionAr : indicator.description}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
        </div>
      </div>
    </div>
  );
};

export default DataStorageIndicator;
