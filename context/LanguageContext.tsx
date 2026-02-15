
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState('es');

  useEffect(() => {
    const saved = localStorage.getItem('bdai_lang');
    if (saved && TRANSLATIONS[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLangState(lang);
    localStorage.setItem('bdai_lang', lang);
  };

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    
    const getVal = (dict: any, path: string[]) => {
      if (!dict) return null;
      let current = dict;
      for (const k of path) {
        if (current && current[k]) {
          current = current[k];
        } else {
          return null;
        }
      }
      return current;
    };

    // 1. Intentar en el idioma actual
    let translation = getVal(TRANSLATIONS[language], keys);
    
    // 2. Fallback al inglés si el idioma actual no tiene la clave
    if (!translation && language !== 'en') {
      translation = getVal(TRANSLATIONS['en'], keys);
    }

    // 3. Si sigue sin existir, devolver la clave limpia (ej: 'user' en lugar de 'auth.user' como último recurso)
    return translation || keys[keys.length - 1];
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
