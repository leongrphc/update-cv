"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { tr, type TranslationKeys } from "./translations/tr";
import { en } from "./translations/en";

export type Language = "tr" | "en";

const translations: Record<Language, TranslationKeys> = { tr, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>("tr");

  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null;
    if (stored && (stored === "tr" || stored === "en")) {
      setLangState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
