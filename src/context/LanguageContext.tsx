import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'es';

/** Idioma por defecto del sitio. */
const DEFAULT_LANGUAGE: Language = 'es';
const STORAGE_KEY = 'bioroute-lang';

const isLanguage = (v: unknown): v is Language => v === 'es' || v === 'en';

/**
 * Idioma inicial:
 * 1. `?lang=en` o `?lang=es` en la URL (útil para QR o links por idioma).
 * 2. La última elección del visitante (se recuerda entre páginas y visitas).
 * 3. Español por defecto.
 */
function initialLanguage(): Language {
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (isLanguage(param)) return param;
  } catch {
    /* sin URL disponible */
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    /* almacenamiento bloqueado (modo privado, etc.) */
  }
  return DEFAULT_LANGUAGE;
}

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento bloqueado: el cambio vale solo para esta página */
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
