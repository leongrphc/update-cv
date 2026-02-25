"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  BarChart3,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";
import type { SkillGapAnalysis, DetailedSkillGap } from "@/types";

export default function SkillGapPage() {
  const router = useRouter();
  const [result, setResult] = useState<SkillGapAnalysis | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("skillGapResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("skillGapResult");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleBack = () => {
    sessionStorage.removeItem("skillGapResult");
    router.push("/");
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "critical":
        return <span className="badge badge-error">Kritik</span>;
      case "important":
        return <span className="badge badge-warning">Önemli</span>;
      default:
        return <span className="badge badge-info">İyi Olur</span>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "technical":
        return "Teknik";
      case "soft":
        return "Soft Skill";
      case "certification":
        return "Sertifika";
      case "domain":
        return "Alan Bilgisi";
      default:
        return category;
    }
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Beceri Gap Analizi
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-13">
            CV&apos;niz ile hedef pozisyon arasındaki beceri farkları analiz edildi.
          </p>
        </div>

        {/* Readiness Score */}
        <div className="card-elevated mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-slate-600" />
              <h2 className="font-medium text-slate-900 dark:text-slate-100">Hazırlık Skoru</h2>
            </div>
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {result.overallReadiness}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${result.overallReadiness}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Bu pozisyon için genel hazırlık durumunuz
          </p>
        </div>

        {/* Strong Points */}
        <div className="card-elevated mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-medium text-slate-900 dark:text-slate-100">Güçlü Yönleriniz</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {result.strongPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-emerald-800 dark:text-emerald-300">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="card-elevated mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="font-medium text-slate-900">
              Geliştirilmesi Gereken Beceriler ({result.gaps.length})
            </h2>
          </div>
          <div className="space-y-4">
            {result.gaps.map((gap: DetailedSkillGap, index: number) => (
              <div
                key={index}
                className="border border-slate-200 dark:border-slate-700 rounded-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{gap.skill}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {getCategoryLabel(gap.category)}
                    </p>
                  </div>
                  {getImportanceBadge(gap.importance)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Mevcut Seviye: </span>
                    <span className="text-slate-700 dark:text-slate-300 capitalize">
                      {gap.currentLevel}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Gereken Seviye: </span>
                    <span className="text-slate-700 dark:text-slate-300 capitalize">
                      {gap.requiredLevel}
                    </span>
                  </div>
                </div>

                {/* Learning Path */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-slate-600" />
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Öğrenme Yolu
                    </h4>
                    <div className="flex items-center gap-1 ml-auto text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {gap.learningPath.estimatedTime}
                    </div>
                  </div>

                  {gap.learningPath.courses.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Önerilen Kurslar:</p>
                      <ul className="text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {gap.learningPath.courses.slice(0, 3).map((course, i) => (
                          <li key={i}>{course}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {gap.learningPath.certifications.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Sertifikalar:</p>
                      <div className="flex flex-wrap gap-2">
                        {gap.learningPath.certifications.map((cert, i) => (
                          <span key={i} className="badge badge-info">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Alternatif Strateji:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{gap.workaround}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card-elevated">
          <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Genel Öneriler</h2>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-slate-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <button onClick={handleBack} className="btn-secondary w-full">
            Yeni Analiz Yap
          </button>
        </div>
    </div>
  );
}
