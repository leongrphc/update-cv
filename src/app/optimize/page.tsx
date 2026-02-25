"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import {
  FileText,
  Target,
  BarChart3,
  Mail,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Building2,
  Rocket,
  Settings2,
} from "lucide-react";
import type {
  OptimizationMode,
  ExperienceLevel,
  CVLanguage,
  IndustryType,
  OptimizationOptions,
} from "@/types";

type TabType = "optimize" | "gap" | "cover-letter";

const MODE_OPTIONS: {
  id: OptimizationMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "standard",
    label: "Standart",
    description: "Dengeli optimizasyon",
    icon: Target,
  },
  {
    id: "aggressive",
    label: "Agresif",
    description: "Maksimum ATS skoru",
    icon: Zap,
  },
  {
    id: "corporate",
    label: "Kurumsal",
    description: "Resmi ve stratejik ton",
    icon: Building2,
  },
  {
    id: "startup",
    label: "Startup",
    description: "Dinamik ve girişimci",
    icon: Rocket,
  },
];

const LEVEL_OPTIONS: { id: ExperienceLevel; label: string }[] = [
  { id: "intern", label: "Stajyer / Yeni Mezun" },
  { id: "junior", label: "Junior (0-2 Yıl)" },
  { id: "mid", label: "Mid-Level (2-5 Yıl)" },
  { id: "senior", label: "Senior (5-10 Yıl)" },
  { id: "lead", label: "Lead / Manager (10+ Yıl)" },
];

const INDUSTRY_OPTIONS: { id: IndustryType; label: string }[] = [
  { id: "tech", label: "Teknoloji" },
  { id: "finance", label: "Finans" },
  { id: "health", label: "Sağlık" },
  { id: "ecommerce", label: "E-Ticaret" },
  { id: "consulting", label: "Danışmanlık" },
  { id: "manufacturing", label: "Üretim" },
  { id: "other", label: "Diğer" },
];

export default function OptimizePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("optimize");
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options state
  const [mode, setMode] = useState<OptimizationMode>("standard");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("mid");
  const [language, setLanguage] = useState<CVLanguage>("tr");
  const [industry, setIndustry] = useState<IndustryType | "">("");

  const canProceed =
    cvText.trim().length > 0 && jobDescription.trim().length > 0;

  const handleOptimize = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    setError(null);
    try {
      const options: OptimizationOptions = {
        mode,
        experienceLevel,
        language,
        ...(industry ? { industry: industry as IndustryType } : {}),
      };

      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription,
          targetRole: targetRole || undefined,
          options,
        }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem("optimizationResult", JSON.stringify(data));
        sessionStorage.setItem("jobDescription", jobDescription);
        router.push("/result");
      } else {
        setError(data.error || "Optimizasyon sırasında bir hata oluştu");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription,
          tone: "professional",
        }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem("coverLetterResult", JSON.stringify(data));
        router.push("/cover-letter");
      } else {
        setError(data.error || "Ön yazı oluşturulurken hata oluştu");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillGap = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobDescription }),
      });
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem("skillGapResult", JSON.stringify(data));
        router.push("/skill-gap");
      } else {
        setError(data.error || "Beceri analizi yapılırken hata oluştu");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "optimize" as TabType, label: "CV Optimize Et", icon: Target },
    { id: "gap" as TabType, label: "Beceri Analizi", icon: BarChart3 },
    { id: "cover-letter" as TabType, label: "Ön Yazı", icon: Mail },
  ];

  const handleAction = () => {
    switch (activeTab) {
      case "optimize":
        return handleOptimize();
      case "cover-letter":
        return handleCoverLetter();
      case "gap":
        return handleSkillGap();
    }
  };

  const getActionText = () => {
    switch (activeTab) {
      case "optimize":
        return "CV'yi Optimize Et";
      case "cover-letter":
        return "Ön Yazı Oluştur";
      case "gap":
        return "Beceri Analizi Yap";
      default:
        return "Devam Et";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Optimize
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Upload your CV and paste a job description to get started.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            CV Yükle
          </h2>
          <FileUpload onFileSelect={setCvText} isLoading={isLoading} />
          {cvText && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                CV yüklendi ({cvText.length.toLocaleString("tr-TR")} karakter)
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            İş İlanı
          </h2>
          <JobDescriptionInput
            value={jobDescription}
            onChange={setJobDescription}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Target Role */}
      {activeTab === "optimize" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
            Hedef Pozisyon (Opsiyonel)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Mevcut deneyiminiz farklı bir pozisyon için mi? Örneğin Developer
            iken Tester pozisyonuna başvuruyorsanız belirtin.
          </p>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Örn: QA Engineer, Product Manager, Data Analyst..."
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Advanced Options */}
      {activeTab === "optimize" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mt-6 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Gelişmiş Seçenekler
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-6">
              {/* Optimization Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Optimizasyon Modu
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setMode(opt.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border-2 text-left transition-all ${
                          mode === opt.id
                            ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            mode === opt.id
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              mode === opt.id
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level & Industry */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Deneyim Seviyesi
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) =>
                      setExperienceLevel(e.target.value as ExperienceLevel)
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sektör (Opsiyonel)
                  </label>
                  <select
                    value={industry}
                    onChange={(e) =>
                      setIndustry(e.target.value as IndustryType | "")
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    <option value="">Seçiniz...</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  CV Dili
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLanguage("tr")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      language === "tr"
                        ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    Türkçe
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      language === "en"
                        ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-8">
        <button
          onClick={handleAction}
          disabled={!canProceed || isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              İşleniyor...
            </>
          ) : (
            <>
              {getActionText()}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
