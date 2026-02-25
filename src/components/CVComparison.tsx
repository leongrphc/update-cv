"use client";

import { useState } from "react";
import { Check, AlertCircle, TrendingUp, FileText, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillGapItem, KeywordAnalysis, ATSScore } from "@/types";

interface CVComparisonProps {
  originalCV: string;
  optimizedCV: string;
  improvements: string[];
  atsScore: ATSScore;
  keywords?: KeywordAnalysis;
  roleAdaptations?: string[];
  skillGaps?: SkillGapItem[];
}

type TabType = "comparison" | "improvements" | "keywords" | "gaps";

export function CVComparison({
  originalCV,
  optimizedCV,
  improvements,
  atsScore,
  keywords,
  roleAdaptations,
  skillGaps,
}: CVComparisonProps) {
  const [activeTab, setActiveTab] = useState<TabType>("comparison");

  const tabs = [
    { id: "comparison" as TabType, label: "Karşılaştırma" },
    { id: "improvements" as TabType, label: `İyileştirmeler (${improvements.length})` },
    { id: "keywords" as TabType, label: "Anahtar Kelimeler" },
    ...(skillGaps && skillGaps.length > 0
      ? [{ id: "gaps" as TabType, label: `Eksik Beceriler (${skillGaps.length})` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Role Adaptations */}
      {roleAdaptations && roleAdaptations.length > 0 && (
        <div className="card-elevated border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-slate-900 dark:text-slate-50">Pozisyon Uyarlamaları</h3>
          </div>
          <ul className="space-y-2">
            {roleAdaptations.map((adaptation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                {adaptation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "tab-button",
                activeTab === tab.id ? "tab-button-active" : "tab-button-inactive"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "comparison" && (
        <div className="grid lg:grid-cols-2 gap-4 animate-fade-in">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h4 className="font-medium text-slate-600 dark:text-slate-400 text-sm">Orijinal CV</h4>
            </div>
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-sm max-h-[500px] overflow-y-auto text-sm leading-relaxed">
              {originalCV}
            </div>
          </div>
          <div className="card border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">Optimize Edilmiş CV</h4>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-slate-800 p-4 rounded-sm max-h-[500px] overflow-y-auto text-sm leading-relaxed">
              {optimizedCV}
            </div>
          </div>
        </div>
      )}

      {activeTab === "improvements" && (
        <div className="card animate-fade-in">
          <ul className="space-y-3">
            {improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "keywords" && keywords && (
        <div className="space-y-4 animate-fade-in">
          {keywords.matched.length > 0 && (
            <div className="card">
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Eşleşen Anahtar Kelimeler
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.matched.map((keyword, index) => (
                  <span key={index} className="badge badge-success">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {keywords.added.length > 0 && (
            <div className="card">
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Eklenen Anahtar Kelimeler
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.added.map((keyword, index) => (
                  <span key={index} className="badge badge-info">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {keywords.missing.length > 0 && (
            <div className="card border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/20">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Eklenemeyen Beceriler
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Bu beceriler iş ilanında var ancak CV&apos;nizde bulunamadı. Bu becerileri edinmeyi düşünebilirsiniz.
              </p>
              <div className="flex flex-wrap gap-2">
                {keywords.missing.map((keyword, index) => (
                  <span key={index} className="badge badge-warning">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "gaps" && skillGaps && (
        <div className="card animate-fade-in">
          <div className="space-y-4">
            {skillGaps.map((gap, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-50">{gap.skill}</h4>
                  <span
                    className={cn(
                      "badge",
                      gap.importance === "critical" && "badge-error",
                      gap.importance === "important" && "badge-warning",
                      gap.importance === "nice-to-have" && "badge-info"
                    )}
                  >
                    {gap.importance === "critical"
                      ? "Kritik"
                      : gap.importance === "important"
                      ? "Önemli"
                      : "İyi Olur"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{gap.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
