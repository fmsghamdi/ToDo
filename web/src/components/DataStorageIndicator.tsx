import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/useLanguage';

interface DataStorageIndicatorProps {
  className?: string;
}

const DataStorageIndicator: React.FC<DataStorageIndicatorProps> = ({ className = '' }) => {
  const { language } = useLanguage();
  const [storageType, setStorageType] = useState<'local' | 'database' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    checkStorageType();
    // Check every 30 seconds
    const interval = setInterval(checkStorageType, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStorageType = async () => {
    try {
      // Try to ping the API server using ApiService
      const { apiService } = await import('../services/ApiService');
      const isAvailable = await apiService.isApiAvailable();
      
      if (isAvailable) {
        setStorageType('database');
        setLastSync(new Date());
      } else {
        setStorageType('local');
      }
    } catch {
      // API server not available, using localStorage
      setStorageType('local');
    }
  };

  const getIndicatorContent = () => {
    switch (storageType) {
      case 'database':
        return {
          icon: '🗄️',
          text: 'Database',
          textAr: 'قاعدة البيانات',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          description: 'Data stored in SQL database',
          descriptionAr: 'البيانات محفوظة في قاعدة البيانات SQL'
        };
      case 'local':
        return {
          icon: '💾',
          text: 'Local Storage',
          textAr: 'حفظ محلي',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          description: 'Data stored in browser only',
          descriptionAr: 'البيانات محفوظة في المتصفح فقط'
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
        <div className={`w-2 h-2 rounded-full ${indicator.color} ${storageType === 'checking' ? 'animate-pulse' : ''}`}></div>
        <span className="text-sm">{indicator.icon}</span>
        <span className={`text-sm font-medium ${indicator.textColor}`}>
          {language === 'ar' ? indicator.textAr : indicator.text}
        </span>
        {lastSync && storageType === 'database' && (
          <span className="text-xs text-gray-500">
            ({lastSync.toLocaleTimeString()})
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="relative group">
        <button className="text-gray-400 hover:text-gray-600 text-sm">ℹ️</button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          {language === 'ar' ? indicator.descriptionAr : indicator.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
};

export default DataStorageIndicator;
