import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, categoryTranslations, cityTranslations } from '../utils/translations';

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: 'ka', flag: '🇬🇪', name: 'ქართული' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ka');

  useEffect(() => {
    SecureStore.getItemAsync('app_lang').then(saved => {
      if (saved && translations[saved]) setLang(saved);
    }).catch(() => {});
  }, []);

  function switchLang() {
    const idx = LANGUAGES.findIndex(l => l.code === lang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLang(next.code);
    SecureStore.setItemAsync('app_lang', next.code).catch(() => {});
  }

  function t(key) {
    return translations[lang]?.[key] || translations['ka']?.[key] || key;
  }

  function tCat(georgianName) {
    if (!georgianName) return georgianName;
    if (lang === 'ka') return georgianName;
    return categoryTranslations[lang]?.[georgianName] || georgianName;
  }

  function tCity(georgianCity) {
    if (!georgianCity) return georgianCity;
    if (lang === 'ka') return georgianCity;
    return cityTranslations[lang]?.[georgianCity] || georgianCity;
  }

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, t, tCat, tCity, switchLang, currentLang, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
