"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-sm">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-sm transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-slate-700 shadow-sm"
            : "hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Açık Tema"
      >
        <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-sm transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-slate-700 shadow-sm"
            : "hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Koyu Tema"
      >
        <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-sm transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-slate-700 shadow-sm"
            : "hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Sistem Teması"
      >
        <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
}
