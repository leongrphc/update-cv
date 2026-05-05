"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Trash2,
  Loader2,
  Clock,
  Target,
  Eye,
  ArrowLeftRight,
  X,
} from "lucide-react";
import CVDiff from "@/components/CVDiff";
import Pagination from "@/components/Pagination";

interface CVVersion {
  id: string;
  label: string;
  cvText: string;
  sourceType: string;
  atsScore: number | null;
  targetRole: string | null;
  createdAt: string;
}

export default function CVVersionsPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comparePair, setComparePair] = useState<[string, string] | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadVersions = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/cv-versions?page=${p}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.success) {
        setVersions(data.items || []);
        setTotal(data.total || 0);
      } else if (res.status === 401) {
        setVersions([]);
      }
    } catch {
      // API error
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadVersions(page);
  }, [page, loadVersions]);

  const deleteVersion = async (id: string) => {
    try {
      const res = await fetch(`/api/cv-versions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVersions((prev) => prev.filter((v) => v.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch {
      // Delete failed
    }
  };

  const optimizeVersion = (version: CVVersion) => {
    sessionStorage.setItem("cvText", version.cvText);
    router.push("/optimize");
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

  const getSourceLabel = (type: string) => {
    switch (type) {
      case "optimization": return "Optimizasyon";
      case "manual": return "Manuel";
      case "import": return "İçe Aktarma";
      default: return type;
    }
  };

  const selectedForCompare = comparePair
    ? versions.filter((v) => comparePair.includes(v.id))
    : [];

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            CV Versiyonları
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Optimize edilmiş CV&apos;lerinizin tüm versiyonları.
          </p>
        </div>
      </div>

      {/* Compare View */}
      {comparePair && selectedForCompare.length === 2 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Karşılaştırma
            </h2>
            <button
              onClick={() => setComparePair(null)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Kapat
            </button>
          </div>
          <CVDiff
            oldText={selectedForCompare[0].cvText}
            newText={selectedForCompare[1].cvText}
            oldLabel={selectedForCompare[0].label}
            newLabel={selectedForCompare[1].label}
          />
        </div>
      )}

      {/* Preview Modal */}
      {previewId && (() => {
        const v = versions.find((ver) => ver.id === previewId);
        if (!v) return null;
        return (
          <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {v.label}
              </h3>
              <button
                onClick={() => setPreviewId(null)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Kapat
              </button>
            </div>
            <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
              {v.cvText}
            </pre>
          </div>
        );
      })()}

      {versions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-12 text-center">
          <GitBranch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Henüz versiyon yok
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            CV&apos;nizi optimize ettiğinizde versiyonlar burada görünecek.
          </p>
          <button
            onClick={() => router.push("/optimize")}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Optimize Etmeye Başla
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-50">
                        {version.label}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {version.targetRole && (
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Target className="w-3 h-3" />
                            {version.targetRole}
                          </span>
                        )}
                        {version.atsScore && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ATS: {version.atsScore}%
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                          {getSourceLabel(version.sourceType)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewId(previewId === version.id ? null : version.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (!comparePair) {
                          setComparePair([version.id, ""]);
                        } else if (comparePair[0] && !comparePair[1]) {
                          if (comparePair[0] !== version.id) {
                            setComparePair([comparePair[0], version.id]);
                          }
                        } else {
                          setComparePair([version.id, ""]);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        comparePair?.includes(version.id)
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                      title="Karşılaştır"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => optimizeVersion(version)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      Tekrar Optimize Et
                    </button>
                    <button
                      onClick={() => deleteVersion(version.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Compare selection hint */}
                {comparePair && comparePair[0] === version.id && !comparePair[1] && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 pl-[52px]">
                    ↑ Seçili — karşılaştırmak için ikinci versiyonu seçin
                  </p>
                )}
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
