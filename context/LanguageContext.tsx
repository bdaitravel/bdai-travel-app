
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode, initialLanguage?: string }> = ({ children, initialLanguage = 'es' }) => {
  const [language, setLangState] = useState(initialLanguage);

  useEffect(() => {
    const saved = localStorage.getItem('bdai_lang');
    if (saved) setLangState(saved);
  }, []);

  const setLanguage = (lang: string) => {
    setLangState(lang);
    localStorage.setItem('bdai_lang', lang);
  };

  const t = useCallback((key: string) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    const keys = key.split('.');
    let result: any = dict;
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return TRANSLATIONS['en'][key] || key;
      }
    }
    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
