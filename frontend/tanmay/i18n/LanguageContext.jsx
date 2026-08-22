import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

/**
 * Language Provider — wraps the app to provide Hindi/English i18n.
 * Persists language selection in localStorage.
 */
export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('jh_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const t = useCallback(
    (key) => {
      return translations[lang]?.[key] || translations['en']?.[key] || key;
    },
    [lang]
  );

  const switchLanguage = useCallback((newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('jh_lang', newLang);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    switchLanguage(newLang);
  }, [lang, switchLanguage]);

  return (
    <LanguageContext.Provider value={{ lang, t, switchLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to access translation function and language state
 * @returns {{ lang: string, t: (key: string) => string, switchLanguage: (lang: string) => void, toggleLanguage: () => void }}
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
