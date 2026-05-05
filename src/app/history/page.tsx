"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Target,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Briefcase,
  MapPin,
  Building2,
  ExternalLink,
  Search,
} from "lucide-react";
import Pagination from "@/components/Pagination";

interface HistoryItem {
  id: string;
  targetRole: string;
  company?: string;
  atsScoreBefore: number;
  atsScoreAfter: number;
  createdAt: string;
  optimizedCV: string;
  originalCV: string;
  matchedKeywords?: string[];
  addedKeywords?: string[];
  missingSkills?: string[];
  improvements?: string[];
}

interface JobSearchItem {
  id: string;
  keywords: string;
  location?: string | null;
  jobType?: string | null;
  resultCount: number;
  searchedAt: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    url: string;
    description: string;
  }[];
}

type TabType = "optimizations" | "job-searches";

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("optimizations");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [jobSearches, setJobSearches] = useState<JobSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);
  const [optimPage, setOptimPage] = useState(1);
  const [optimTotal, setOptimTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const pageSize = 10;

  const loadHistory = useCallback(async (page: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/history?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setHistory([]);
          return;
        }
        throw new Error(data.error || "Geçmiş yüklenemedi");
      }

      setHistory(data.items || []);
      setOptimTotal(data.total || 0);
    } catch (err) {
      console.error("History load error:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const loadJobSearches = useCallback(async (page: number) => {
    try {
      const response = await fetch(`/api/job-searches?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setJobSearches(data.items || []);
        setSearchTotal(data.total || 0);
      } else if (response.status === 401) {
        setJobSearches([]);
      }
    } catch {
      // API error
    }
  }, [pageSize]);

  useEffect(() => {
    if (activeTab === "optimizations") {
      loadHistory(optimPage);
    } else {
      loadJobSearches(searchPage);
    }
  }, [activeTab, optimPage, searchPage, loadHistory, loadJobSearches]);

  const deleteItem = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Silme işlemi başarısız");
      }

      setHistory((prev) => prev.filter((item) => item.id !== id));
      setOptimTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err instanceof Error ? err.message : "Silme işlemi başarısız");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteJobSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/job-searches?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Silme işlemi başarısız");
      }

      setJobSearches((prev) => prev.filter((s) => s.id !== id));
      setSearchTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Delete job search error:", err);
      alert(err instanceof Error ? err.message : "Silme işlemi başarısız");
    }
  };

  const viewItem = (item: HistoryItem) => {
    sessionStorage.setItem(
      "optimizationResult",
      JSON.stringify({
        success: true,
        originalCV: item.originalCV,
        optimizedCV: item.optimizedCV,
        targetRole: item.targetRole,
        improvements: item.improvements || [],
        roleAdaptations: [],
        keywords: {
          matched: item.matchedKeywords || [],
          added: item.addedKeywords || [],
          missing: item.missingSkills || [],
        },
        atsScore: { before: item.atsScoreBefore, after: item.atsScoreAfter },
        skillGaps: [],
      })
    );
    router.push("/result");
  };

  const repeatSearch = (search: JobSearchItem) => {
    const params = new URLSearchParams();
    if (search.keywords) params.set("q", search.keywords);
    if (search.location) params.set("loc", search.location);
    if (search.jobType) params.set("type", search.jobType);
    router.push(`/find-jobs?${params.toString()}`);
  };

  const optimizeFromSearch = (job: { title: string; description: string }) => {
    if (job.description) {
      sessionStorage.setItem("jobDescription", job.description);
      sessionStorage.setItem("jobTitle", job.title);
    }
    router.push("/optimize");
  };

  const clearAllOptimizations = async () => {
    if (!confirm("Tüm optimizasyon geçmişini silmek istediğinize emin misiniz?")) return;
    try {
      for (const item of history) {
        await fetch(`/api/history?id=${item.id}`, { method: "DELETE" });
      }
      setHistory([]);
      setOptimTotal(0);
    } catch {
      alert("Bazı kayıtlar silinemedi");
      loadHistory(1);
    }
  };

  const clearAllSearches = async () => {
    if (!confirm("Tüm arama geçmişini silmek istediğinize emin misiniz?")) return;
    try {
      for (const search of jobSearches) {
        await fetch(`/api/job-searches?id=${search.id}`, { method: "DELETE" });
      }
      setJobSearches([]);
      setSearchTotal(0);
    } catch {
      alert("Bazı kayıtlar silinemedi");
      loadJobSearches(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const optimTotalPages = Math.ceil(optimTotal / pageSize);
  const searchTotalPages = Math.ceil(searchTotal / pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const tabs = [
    {
      id: "optimizations" as TabType,
      label: "CV Optimizations",
      icon: FileText,
      count: optimTotal,
    },
    {
      id: "job-searches" as TabType,
      label: "Job Searches",
      icon: Briefcase,
      count: searchTotal,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Your past optimizations and job searches.
          </p>
        </div>
        {activeTab === "optimizations" && history.length > 0 && (
          <button
            onClick={clearAllOptimizations}
            className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
        {activeTab === "job-searches" && jobSearches.length > 0 && (
          <button
            onClick={clearAllSearches}
            className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "optimizations") setOptimPage(1);
                  else setSearchPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error State */}
      {error && activeTab === "optimizations" && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => loadHistory(optimPage)}
              className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* ======= OPTIMIZATIONS TAB ======= */}
      {activeTab === "optimizations" && (
        <>
          {history.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                No optimizations yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Your CV optimization history will appear here.
              </p>
              <button
                onClick={() => router.push("/optimize")}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Start Optimizing
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-50">
                            {item.targetRole || "CV Optimization"}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {item.atsScoreBefore}%
                              </span>
                              <span className="text-slate-400 mx-0.5">→</span>
                              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                {item.atsScoreAfter}%
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => viewItem(item)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={optimPage}
                totalPages={optimTotalPages}
                onPageChange={setOptimPage}
              />
            </>
          )}
        </>
      )}

      {/* ======= JOB SEARCHES TAB ======= */}
      {activeTab === "job-searches" && (
        <>
          {jobSearches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                No job searches yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Your job search history will appear here.
              </p>
              <button
                onClick={() => router.push("/find-jobs")}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Search Jobs
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {jobSearches.map((search) => (
                  <div
                    key={search.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Search Header */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() =>
                        setExpandedSearch(expandedSearch === search.id ? null : search.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-50">
                              {search.keywords}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              {search.location && (
                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <MapPin className="w-3 h-3" />
                                  {search.location}
                                </span>
                              )}
                              {search.jobType && (
                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Briefcase className="w-3 h-3" />
                                  {search.jobType}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {search.resultCount} results
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {formatDate(search.searchedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              repeatSearch(search);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Search Again
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJobSearch(search.id);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </button>
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              expandedSearch === search.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Jobs List */}
                    {expandedSearch === search.id && search.jobs.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-800">
                        {search.jobs.map((job, index) => (
                          <div
                            key={job.id || index}
                            className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {job.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {job.company}
                                  {job.location ? ` · ${job.location}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                              {job.description && (
                                <button
                                  onClick={() => optimizeFromSearch(job)}
                                  className="px-2.5 py-1 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                                >
                                  Optimize
                                </button>
                              )}
                              {job.url && (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Pagination
                page={searchPage}
                totalPages={searchTotalPages}
                onPageChange={setSearchPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
