import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageContext, LANGUAGES } from '@/context/LanguageContext';

export type LanguageCode = keyof typeof LANGUAGES;

export const languages = {
  en: { name: 'English', flag: '🇬🇧', code: 'en' },
  hi: { name: 'हिंदी', flag: '🇮🇳', code: 'hi' },
  te: { name: 'తెలుగు', flag: '🇮🇳', code: 'te' },
  mr: { name: 'मराठी', flag: '🇮🇳', code: 'mr' },
};

export function useLanguage() {
  const { t } = useTranslation();
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  // Map the context's changeLanguage function to setLanguage for backward compatibility
  const setLanguage = (langCode: LanguageCode) => {
    context.changeLanguage(langCode);
  };
  
  return {
    currentLanguage: context.currentLanguage as LanguageCode,
    setLanguage,
    changeLanguage: context.changeLanguage,
    supportedLanguages: context.supportedLanguages,
    t
  };
}

export default useLanguage;