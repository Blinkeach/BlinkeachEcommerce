import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import Cookies from 'js-cookie';

// Import translation files directly
import enTranslation from '../../public/locales/en/translation.json';
import hiTranslation from '../../public/locales/hi/translation.json';
import teTranslation from '../../public/locales/te/translation.json';
import mrTranslation from '../../public/locales/mr/translation.json';
import bnTranslation from '../../public/locales/bn/translation.json';

// Resources object with translations
const resources = {
  en: {
    translation: enTranslation
  },
  hi: {
    translation: hiTranslation
  },
  te: {
    translation: teTranslation
  },
  mr: {
    translation: mrTranslation
  },
  bn: {
    translation: bnTranslation
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    fallbackLng: 'en', // Default language
    supportedLngs: ['en', 'hi', 'te', 'mr', 'bn'], // Supported languages
    debug: process.env.NODE_ENV === 'development',
    
    // Load resources directly
    resources,
    
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupCookie: 'i18nextLng',
      lookupLocalStorage: 'i18nextLng',
      caches: ['cookie', 'localStorage'],
    },
    
    react: {
      useSuspense: false, // Prevents issues with SSR
    },
  });

// Set up cookie-based language persistence
i18n.on('languageChanged', (lng) => {
  Cookies.set('i18nextLng', lng, { expires: 365 });
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;