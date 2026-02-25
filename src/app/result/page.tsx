"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CVComparison } from "@/components/CVComparison";
import {
  Download,
  Loader2,
  FileText,
  Target,
  TrendingUp,
  FileDown,
  BarChart3,
  MessageSquare,
  Search,
  Lightbulb,
  Users,
  Send,
  Award,
} from "lucide-react";
import type { OptimizationResult, PDFTemplateId, ProTip, EnhanceType } from "@/types";

const PDFDownloadButton = dynamic(
  () => import("@/components/PDFDownloadButton"),
  { ssr: false, loading: () => <Loader2 className="w-5 h-5 animate-spin" /> }
);

const CATEGORY_CONFIG: Record<
  ProTip["category"],
  { label: string; icon: React.ElementType; color: string }
> = {
  interview: {
    label: "Mülakat",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  networking: {
    label: "Network",
    icon: Users,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  application: {
    label: "Başvuru",
    icon: Send,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  skills: {
    label: "Beceri",
    icon: Award,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
};

const TEMPLATE_OPTIONS: {
  id: PDFTemplateId;
  label: string;
  description: string;
  preview: string;
}[] = [
  {
    id: "modern",
    label: "Modern",
    description: "2 sütun, temiz tasarım",
    preview: "||  |",
  },
  {
    id: "classic",
    label: "Klasik",
    description: "Tek sütun, geleneksel",
    preview: " ||| ",
  },
  {
    id: "creative",
    label: "Yaratıcı",
    description: "Koyu sidebar",
    preview: "█| |",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Altın aksanlı, yönetici",
    preview: "▀▀▀▀",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Ultra-temiz, sade",
    preview: "  |  ",
  },
  {
    id: "diamond",
    label: "Diamond",
    description: "Zümrüt yeşil, premium",
    preview: "█▌ |",
  },
];

const ENHANCE_OPTIONS: {
  type: EnhanceType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "metrics",
    label: "Metrikleri Güçlendir",
    description: "Her maddeye ölçülebilir sonuç ekle",
    icon: BarChart3,
  },
  {
    type: "summary",
    label: "Daha Güçlü Özet",
    description: "Profesyonel özeti yeniden yaz",
    icon: FileText,
  },
  {
    type: "keywords",
    label: "Keyword Yoğunluğu",
    description: "Anahtar kelime tekrarını artır",
    icon: Search,
  },
];

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PDFTemplateId>("modern");
  const [enhancingType, setEnhancingType] = useState<EnhanceType | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("optimizationResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("optimizationResult");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleDownloadTxt = async () => {
    if (!result) return;

    setIsDownloading(true);

    try {
      const blob = new Blob([result.optimizedCV], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `optimized-cv-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReEnhance = async (enhanceType: EnhanceType) => {
    if (!result) return;
    setEnhancingType(enhanceType);

    try {
      const jobDescription =
        sessionStorage.getItem("jobDescription") || "";

      const response = await fetch("/api/re-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optimizedCV: result.optimizedCV,
          jobDescription,
          enhanceType,
          targetRole: result.targetRole,
        }),
      });

      const data = await response.json();

      if (data.success && data.enhancedCV) {
        const updatedResult = {
          ...result,
          optimizedCV: data.enhancedCV,
        };
        setResult(updatedResult);
        sessionStorage.setItem(
          "optimizationResult",
          JSON.stringify(updatedResult)
        );
      }
    } catch (error) {
      console.error("Re-enhance error:", error);
    } finally {
      setEnhancingType(null);
    }
  };

  const handleNewOptimization = () => {
    sessionStorage.removeItem("optimizationResult");
    sessionStorage.removeItem("jobDescription");
    router.push("/");
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Title & Score */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
          Optimizasyon Tamamlandı
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          CV&apos;niz {result.targetRole || "hedef pozisyona"} göre optimize
          edildi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-sm flex items-center justify-center">
              <Target className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ATS Skoru
              </p>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 line-through">
                  {result.atsScore.before}%
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                  {result.atsScore.after}%
                </span>
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${result.atsScore.after}%` }}
            />
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                İyileştirme
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                {result.improvements.length} değişiklik
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-sm flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Anahtar Kelime
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                {result.keywords.matched.length +
                  result.keywords.added.length}{" "}
                eşleşme
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      {result.proTips && result.proTips.length > 0 && (
        <div className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
              Pro İpuçları
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.proTips.map((tip, idx) => {
              const config = CATEGORY_CONFIG[tip.category];
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white/70 dark:bg-slate-900/50 rounded-lg p-3"
                >
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {tip.tip}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison */}
      <CVComparison
        originalCV={result.originalCV}
        optimizedCV={result.optimizedCV}
        improvements={result.improvements}
        atsScore={result.atsScore}
        keywords={result.keywords}
        roleAdaptations={result.roleAdaptations}
        skillGaps={result.skillGaps}
      />

      {/* Quick Re-Enhance Buttons */}
      <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Hızlı Güçlendirme
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {ENHANCE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isLoading = enhancingType === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => handleReEnhance(opt.type)}
                disabled={enhancingType !== null}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 flex-shrink-0" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Selector */}
      <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          PDF Şablon Seçimi
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {TEMPLATE_OPTIONS.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                selectedTemplate === tmpl.id
                  ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div
                className={`w-12 h-16 rounded border mb-2 flex items-center justify-center text-xs font-mono ${
                  selectedTemplate === tmpl.id
                    ? "border-slate-400 bg-white dark:bg-slate-700"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                }`}
              >
                {tmpl.preview}
              </div>
              <p
                className={`text-sm font-medium ${
                  selectedTemplate === tmpl.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {tmpl.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tmpl.description}
              </p>
            </button>
          ))}
        </div>

        {/* Download Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PDFDownloadButton
            content={result.optimizedCV}
            targetRole={result.targetRole}
            atsScore={result.atsScore}
            templateId={selectedTemplate}
          />
          <button
            onClick={handleDownloadTxt}
            disabled={isDownloading}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                İndiriliyor...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                TXT Olarak İndir
              </>
            )}
          </button>
          <button
            onClick={handleNewOptimization}
            className="btn-secondary flex-1"
          >
            Farklı İlan İçin Optimize Et
          </button>
        </div>
      </div>
    </div>
  );
}
