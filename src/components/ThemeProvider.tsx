"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Tema uygulama fonksiyonu
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    let isDark = false;

    if (newTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = newTheme === "dark";
    }

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    setResolvedTheme(isDark ? "dark" : "light");
  };

  // İlk yüklemede localStorage'dan oku
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initialTheme = stored || "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // System tema değişikliklerini dinle
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Tema değiştirme fonksiyonu
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
