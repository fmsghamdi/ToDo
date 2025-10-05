import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';
import { LanguageContext } from './LanguageContext';
import type { LanguageContextType } from './LanguageContext';

type Language = 'ar' | 'en';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update body class for styling
    document.body.className = document.body.className.replace(/\b(rtl|ltr)\b/g, '');
    document.body.classList.add(isRTL ? 'rtl' : 'ltr');
  }, [language, isRTL]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
