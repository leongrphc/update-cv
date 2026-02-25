"use client";

import { useState } from "react";

interface AIEnhanceButtonProps {
  content: string;
  contentType: "bullet" | "summary" | "title";
  context?: string;
  onEnhanced: (enhanced: string) => void;
  disabled?: boolean;
}

export default function AIEnhanceButton({
  content,
  contentType,
  context,
  onEnhanced,
  disabled,
}: AIEnhanceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const handleEnhance = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setShowAlternatives(false);

    try {
      const res = await fetch("/api/enhance-cv-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, contentType, context }),
      });

      const data = await res.json();
      if (data.success) {
        onEnhanced(data.enhanced);
        setAlternatives(data.alternatives || []);
        if (data.alternatives?.length) {
          setShowAlternatives(true);
        }
      }
    } catch {
      // Enhancement failed silently
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleEnhance}
        disabled={disabled || isLoading}
        className="mt-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        title="AI ile güçlendir"
      >
        {isLoading ? (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          "✨"
        )}
      </button>

      {showAlternatives && alternatives.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-10 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Alternatifler
            </span>
            <button
              type="button"
              onClick={() => setShowAlternatives(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5">
            {alternatives.map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onEnhanced(alt);
                  setShowAlternatives(false);
                }}
                className="w-full text-left text-xs p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-sm text-slate-700 dark:text-slate-300 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
