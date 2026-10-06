"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FilePlus2,
  Plus,
  Search,
  Target,
  Clock,
  Eye,
  Loader2,
  Pencil,
  Download,
  Briefcase,
  GraduationCap,
  Code2,
  Share2,
  Check,
} from "lucide-react";
import Pagination from "@/components/Pagination";

interface CVItem {
  id: string;
  targetRole: string;
  company?: string | null;
  atsScoreBefore: number;
  atsScoreAfter: number;
  createdAt: string;
  optimizedCV: string;
  originalCV: string;
}

interface CreatedCVItem {
  customSections?: import("@/types").CVCustomSection[];
  targetRole?: string;
  theme?: import("@/types").CVTemplateTheme;
  id: string;
  title: string;
  fullName: string;
  professionalTitle: string;
  templateId: string;
  cvLang: "tr" | "en";
  experienceCount: number;
  educationCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
  shareToken?: string | null;
  isPublic?: boolean;
  personalInfo: Record<string, string>;
  experiences: Record<string, unknown>[];
  educations: Record<string, unknown>[];
  skills: Record<string, unknown>;
}

export default function MyCVsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cvs, setCvs] = useState<CVItem[]>([]);
  const [createdCVs, setCreatedCVs] = useState<CreatedCVItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "created" | "optimized">("all");
  const [page, setPage] = useState(1);
  const [optimizedTotal, setOptimizedTotal] = useState(0);
  const [createdTotal, setCreatedTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 10;

  const fetchCVs = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/my-cvs?page=${p}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.success) {
        setCvs(data.cvs?.items || []);
        setOptimizedTotal(data.cvs?.total || 0);
        setCreatedCVs(data.createdCVs?.items || []);
        setCreatedTotal(data.createdCVs?.total || 0);
      }
    } catch {
      // Try sessionStorage fallback
      const stored = sessionStorage.getItem("optimizationResult");
      if (stored) {
        try {
          const result = JSON.parse(stored);
          setCvs([
            {
              id: "local-1",
              targetRole: result.targetRole || "CV Optimization",
              company: null,
              atsScoreBefore: result.atsScore?.before || 0,
              atsScoreAfter: result.atsScore?.after || 0,
              createdAt: new Date().toISOString(),
              optimizedCV: result.optimizedCV || "",
              originalCV: result.originalCV || "",
            },
          ]);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchCVs(page);
  }, [page, fetchCVs]);

  const filteredCvs = cvs.filter(
    (cv) =>
      cv.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cv.company && cv.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCreatedCVs = createdCVs.filter(
    (cv) =>
      cv.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.professionalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewCV = (cv: CVItem) => {
    sessionStorage.setItem(
      "optimizationResult",
      JSON.stringify({
        success: true,
        originalCV: cv.originalCV,
        optimizedCV: cv.optimizedCV,
        targetRole: cv.targetRole,
        improvements: [],
        roleAdaptations: [],
        keywords: { matched: [], added: [], missing: [] },
        atsScore: { before: cv.atsScoreBefore, after: cv.atsScoreAfter },
        skillGaps: [],
      })
    );
    router.push("/result");
  };

  const editCreatedCV = (cv: CreatedCVItem) => {
    sessionStorage.setItem("editCreatedCV", JSON.stringify({
      personalInfo: cv.personalInfo,
      experiences: cv.experiences,
      educations: cv.educations,
      skills: cv.skills,
      templateId: cv.templateId,
      cvLang: cv.cvLang,
      theme: cv.theme,
      customSections: cv.customSections, targetRole: cv.targetRole,
      title: cv.title,
      id: cv.id,
    }));
    router.push(`/create-cv?id=${encodeURIComponent(cv.id)}`);
  };

  const handleShare = async (cv: CreatedCVItem) => {
    try {
      const action = cv.isPublic ? "disable" : "enable";
      const res = await fetch("/api/share-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: cv.id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedCVs((prev) =>
          prev.map((c) =>
            c.id === cv.id
              ? { ...c, shareToken: data.shareToken, isPublic: data.isPublic }
              : c
          )
        );
        if (data.isPublic && data.shareToken) {
          const url = `${window.location.origin}/share/${data.shareToken}`;
          await navigator.clipboard.writeText(url);
          setCopiedId(cv.id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      }
    } catch {
      // ignore
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTemplateLabel = (id: string) => {
    switch (id) {
      case "modern": return "Modern";
      case "classic": return "Klasik";
      case "creative": return "Yaratıcı";
      default: return id;
    }
  };

  const totalCount = optimizedTotal + createdTotal;
  const showCreated = activeTab === "all" || activeTab === "created";
  const showOptimized = activeTab === "all" || activeTab === "optimized";
  const totalPages = Math.ceil(
    (activeTab === "created" ? createdTotal : activeTab === "optimized" ? optimizedTotal : totalCount) / pageSize
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My CVs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Oluşturduğunuz ve optimize ettiğiniz tüm CV&apos;lerinizi yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/create-cv"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            <FilePlus2 className="w-4 h-4" />
            Sıfırdan Oluştur
          </Link>
          <Link
            href="/optimize"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Optimize Et
          </Link>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { id: "all" as const, label: "Tümü", count: totalCount },
            { id: "created" as const, label: "Oluşturulan", count: createdTotal },
            { id: "optimized" as const, label: "Optimize", count: optimizedTotal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="CV ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-shadow"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Created CVs */}
          {showCreated && filteredCreatedCVs.map((cv) => (
            <div
              key={`created-${cv.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FilePlus2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {cv.fullName}
                      </h3>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                        Oluşturulan
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {cv.professionalTitle}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {getTemplateLabel(cv.templateId)} şablon
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(cv.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mr-2">
                    <span className="flex items-center gap-1" title="Deneyim">
                      <Briefcase className="w-3.5 h-3.5" />
                      {cv.experienceCount}
                    </span>
                    <span className="flex items-center gap-1" title="Eğitim">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {cv.educationCount}
                    </span>
                    <span className="flex items-center gap-1" title="Beceri">
                      <Code2 className="w-3.5 h-3.5" />
                      {cv.skillCount}
                    </span>
                  </div>
                  <button
                    onClick={() => handleShare(cv)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      cv.isPublic
                        ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={cv.isPublic ? "Paylaşımı kapat" : "Paylaş"}
                  >
                    {copiedId === cv.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {copiedId === cv.id ? "Kopyalandı" : cv.isPublic ? "Paylaşıldı" : "Paylaş"}
                  </button>
                  <button
                    onClick={() => editCreatedCV(cv)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("downloadCreatedCV", JSON.stringify({
                        personalInfo: cv.personalInfo,
                        experiences: cv.experiences,
                        educations: cv.educations,
                        skills: cv.skills,
                        templateId: cv.templateId,
                        cvLang: cv.cvLang,
        theme: cv.theme,
      customSections: cv.customSections, targetRole: cv.targetRole,
                        id: cv.id,
                        title: cv.title,
                      }));
                      router.push(`/create-cv?id=${encodeURIComponent(cv.id)}&download=true`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    İndir
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Optimized CVs */}
          {showOptimized && filteredCvs.map((cv) => (
            <div
              key={`opt-${cv.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {cv.targetRole}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                        Optimize
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {cv.company && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {cv.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(cv.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className={`text-lg font-bold ${getScoreColor(cv.atsScoreAfter)}`}>
                      {cv.atsScoreAfter}%
                    </span>
                  </div>
                  <button
                    onClick={() => viewCV(cv)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Görüntüle
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {((showCreated && filteredCreatedCVs.length === 0) &&
            (showOptimized && filteredCvs.length === 0)) ||
           (!showCreated && showOptimized && filteredCvs.length === 0) ||
           (showCreated && !showOptimized && filteredCreatedCVs.length === 0) ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5">
                <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery ? "Sonuç bulunamadı" : "Henüz CV yok"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {searchQuery
                  ? "Farklı bir arama terimi deneyin."
                  : "Sıfırdan yeni bir CV oluşturun veya mevcut CV'nizi optimize edin."}
              </p>
              {!searchQuery && (
                <div className="flex items-center gap-3">
                  <Link
                    href="/create-cv"
                    className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                  >
                    Sıfırdan Oluştur
                  </Link>
                  <Link
                    href="/optimize"
                    className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Optimize Et
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          {/* Pagination */}
          {!searchQuery && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
