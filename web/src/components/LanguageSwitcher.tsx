import React from 'react';
import { useLanguage } from '../i18n/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 left-4 z-[100]">
      {/* Cute Language Switcher */}
      <div className="relative group">
        {/* Language Button - Small and cute */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg shadow-md border border-green-400/30 transition-all duration-300 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300/50 backdrop-blur-sm"
        >
          {/* Language flag */}
          <div className="relative">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
              language === 'ar' ? 'bg-yellow-400' : 'bg-blue-400'
            }`}>
              <span className="text-xs">
                {language === 'ar' ? '🇸🇦' : '🇬🇧'}
              </span>
            </div>
            
            {/* Switch animation on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m0 0l-4-4m4 4l4-4" />
              </svg>
            </div>
          </div>
          
          {/* Language text - smaller */}
          <span className="text-xs font-medium tracking-wide">
            {language === 'ar' ? 'ع' : 'EN'}
          </span>
        </button>

        {/* Language Tooltip - positioned better */}
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
          <div className="p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Language</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">🇸🇦</span>
                  <span className="text-xs text-gray-700">العربية</span>
                </div>
                {language === 'ar' && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center text-xs">🇬🇧</span>
                  <span className="text-xs text-gray-700">English</span>
                </div>
                {language === 'en' && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
