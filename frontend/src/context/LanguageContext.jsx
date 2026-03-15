import { createContext, useContext, useState, useCallback } from 'react';

import en from '../translations/en.json';
import fr from '../translations/fr.json';
import nl from '../translations/nl.json';

const translations = { en, fr, nl };

const LANGUAGES = [
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'EN', locale: 'en-GB' },
  { code: 'fr', flag: '\u{1F1E7}\u{1F1EA}', label: 'FR', locale: 'fr-BE' },
  { code: 'nl', flag: '\u{1F1E7}\u{1F1EA}', label: 'NL', locale: 'nl-BE' },
];

const LanguageContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const setLanguage = (lang) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const cycleLanguage = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next.code);
  };

  const t = useCallback((key, params) => {
    let text = getNestedValue(translations[language], key)
      || getNestedValue(translations.en, key)
      || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
    }
    return text;
  }, [language]);

  const tp = useCallback((key, count, params) => {
    const pluralKey = count !== 1 ? `${key}_plural` : key;
    return t(pluralKey, { count, ...params });
  }, [t]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, cycleLanguage, t, tp, currentLang, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
