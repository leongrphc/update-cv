"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { computeCVScore } from "@/lib/client-ats-score";
import type { CreateCVFormData } from "@/types";

interface CVScoreWidgetProps {
  formData: CreateCVFormData;
}

export function CVScoreWidget({ formData }: CVScoreWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const score = useMemo(() => computeCVScore(formData), [formData]);

  const getColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getBgColor = (pct: number) => {
    if (pct >= 80) return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    if (pct >= 50) return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 sticky top-4">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${getBgColor(score.total)}`}
          >
            <span className={getColor(score.total)}>{score.total}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              CV Puanı
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {score.total >= 80
                ? "Mükemmel!"
                : score.total >= 50
                ? "İyi, geliştirilebilir"
                : "Daha fazla bilgi ekleyin"}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {score.sections.map((section) => {
            const pct = Math.round((section.score / section.max) * 100);
            return (
              <div key={section.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {section.label}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {section.score}/{section.max}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getBarColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Tips */}
          {score.tips.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  İpuçları
                </p>
              </div>
              <ul className="space-y-1">
                {score.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                  >
                    <span className="text-amber-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
