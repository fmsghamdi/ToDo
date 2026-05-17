import React from 'react';
import { useLanguage } from '../i18n/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggle = () => setLanguage(language === 'ar' ? 'en' : 'ar');
  const isAr = language === 'ar';

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface transition-colors text-xs"
      style={{color: 'var(--text-secondary)'}}
      title={isAr ? 'English' : 'العربية'}
    >
      <span className="text-base leading-none">{isAr ? '🇸🇦' : '🇬🇧'}</span>
      <span className="font-medium">{isAr ? 'EN' : 'AR'}</span>
    </button>
  );
};

export default LanguageSwitcher;
