import React from 'react';
import { useLanguage } from '../i18n/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggle = () => setLanguage(language === 'ar' ? 'en' : 'ar');
  const isAr = language === 'ar';

  return (
    <div className="fixed top-4 left-4 z-[100]">
      <button
        onClick={toggle}
        className="relative flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-lg hover:bg-white/20 transition-all duration-300 hover:shadow-xl group"
        title={isAr ? 'English' : 'العربية'}
      >
        {/* Glow on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Saudi Flag Circle */}
        <div className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${isAr ? 'bg-green-600 shadow-inner' : 'bg-blue-500 shadow-inner'}`}>
          <span className={`text-xs leading-none transition-all duration-300 ${isAr ? 'scale-100' : 'scale-0 absolute'}`}>
            🇸🇦
          </span>
          <span className={`text-xs leading-none transition-all duration-300 ${isAr ? 'scale-0 absolute' : 'scale-100'}`}>
            🇬🇧
          </span>
        </div>

        {/* Label */}
        <span className={`relative text-sm font-semibold tracking-wide transition-all duration-300 ${
          isAr ? 'text-white' : 'text-white'
        }`}>
          {isAr ? 'العربية' : 'English'}
        </span>

        {/* Toggle arrow icon */}
        <svg
          className={`relative w-4 h-4 text-white/70 transition-transform duration-300 ${isAr ? 'rotate-0' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
        </svg>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
