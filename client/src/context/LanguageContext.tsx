import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from 'i18next';
import Cookies from 'js-cookie';

// Define the supported languages
export const LANGUAGES = {
  en: { name: 'English', code: 'en' },
  hi: { name: 'हिंदी', code: 'hi' }, // Hindi
  te: { name: 'తెలుగు', code: 'te' }, // Telugu
  mr: { name: 'मराठी', code: 'mr' }, // Marathi
  bn: { name: 'বাংলা', code: 'bn' }, // Bengali
};

// Define the type for the language context
type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  supportedLanguages: typeof LANGUAGES;
};

// Create the context with a default value
export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  changeLanguage: () => {},
  supportedLanguages: LANGUAGES,
});

// Define the provider props
type LanguageProviderProps = {
  children: ReactNode;
};

// Create a provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Get the initial language from cookie, localStorage or browser default
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    Cookies.get('i18nextLng') || localStorage.getItem('i18nextLng') || 'en'
  );

  // Effect to initialize the language
  useEffect(() => {
    // Make sure the current language is one of the supported ones
    if (!Object.keys(LANGUAGES).includes(currentLanguage)) {
      setCurrentLanguage('en');
    }
    
    // Set the i18next language
    i18n.changeLanguage(currentLanguage);
  }, [currentLanguage]);

  // Function to change the language
  const changeLanguage = (language: string) => {
    if (Object.keys(LANGUAGES).includes(language)) {
      i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Store the language preference
      Cookies.set('i18nextLng', language, { expires: 365 });
      localStorage.setItem('i18nextLng', language);
      
      // Set the HTML lang attribute for accessibility and SEO
      document.documentElement.setAttribute('lang', language);
      
      // For RTL languages (not applicable for our current supported languages)
      // if (['ar', 'he', 'fa'].includes(language)) {
      //   document.body.dir = 'rtl';
      // } else {
      //   document.body.dir = 'ltr';
      // }
    }
  };

  // The context value
  const contextValue: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    supportedLanguages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};