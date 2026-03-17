import { createContext, useContext, useState } from 'react';
import { translations } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('boen_lang') || 'it');

  const t = translations[lang];

  function toggleLang() {
    const next = lang === 'it' ? 'en' : 'it';
    setLang(next);
    localStorage.setItem('boen_lang', next);
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
