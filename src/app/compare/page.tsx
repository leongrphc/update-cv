"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import {
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  BarChart3,
  Trophy,
  AlertCircle,
} from "lucide-react";
import type { JobComparisonResult } from "@/types";

interface JobInput {
  id: string;
  text: string;
  title: string;
}

export default function ComparePage() {
  const router = useRouter();
  const [cvText, setCvText] = useState("");
  const [jobs, setJobs] = useState<JobInput[]>([
    { id: "job-1", text: "", title: "İlan 1" },
    { id: "job-2", text: "", title: "İlan 2" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobComparisonResult | null>(null);

  const canCompare = cvText.trim().length > 0 && jobs.filter((j) => j.text.trim().length > 0).length >= 2;

  const addJob = () => {
    if (jobs.length >= 5) return;
    setJobs([...jobs, { id: `job-${Date.now()}`, text: "", title: `İlan ${jobs.length + 1}` }]);
  };

  const removeJob = (id: string) => {
    if (jobs.length <= 2) return;
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const updateJob = (id: string, field: "text" | "title", value: string) => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
  };

  const handleCompare = async () => {
    if (!canCompare) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const validJobs = jobs.filter((j) => j.text.trim().length > 0);
      const response = await fetch("/api/compare-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobs: validJobs.map((j) => ({ id: j.id, description: j.text })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Karşılaştırma sırasında bir hata oluştu");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case "low":
        return <span className="badge badge-success">Düşük Efor</span>;
      case "medium":
        return <span className="badge badge-warning">Orta Efor</span>;
      case "high":
        return <span className="badge badge-error">Yüksek Efor</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-5xl mx-auto">
        {!result ? (
          <>
            {/* CV Upload */}
            <div className="card-elevated mb-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-4">CV Yükle</h2>
              <FileUpload onFileSelect={setCvText} isLoading={isLoading} />
              {cvText && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-sm">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CV yüklendi ({cvText.length.toLocaleString("tr-TR")} karakter)
                  </p>
                </div>
              )}
            </div>

            {/* Job Inputs */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50">İş İlanları</h2>
                {jobs.length < 5 && (
                  <button
                    onClick={addJob}
                    className="btn-ghost flex items-center gap-2 text-sm"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4" />
                    İlan Ekle
                  </button>
                )}
              </div>

              {jobs.map((job, index) => (
                <div key={job.id} className="card-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={job.title}
                      onChange={(e) => updateJob(job.id, "title", e.target.value)}
                      className="font-medium text-slate-900 dark:text-slate-50 bg-transparent border-none focus:outline-none"
                      placeholder={`İlan ${index + 1}`}
                      disabled={isLoading}
                    />
                    {jobs.length > 2 && (
                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={job.text}
                    onChange={(e) => updateJob(job.id, "text", e.target.value)}
                    placeholder="İş ilanının tam metnini buraya yapıştırın..."
                    className="input-base min-h-[120px] resize-y text-sm"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-sm">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleCompare}
              disabled={!canCompare || isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Karşılaştırılıyor...
                </>
              ) : (
                <>
                  İlanları Karşılaştır
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-6">
              <button
                onClick={() => setResult(null)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4"
              >
                ← Yeni Karşılaştırma
              </button>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Karşılaştırma Sonuçları</h2>
              <p className="text-slate-500 dark:text-slate-400">{result.comparisons.length} ilan analiz edildi</p>
            </div>

            {/* Best Match */}
            <div className="card-elevated border-l-4 border-l-emerald-500 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-medium text-slate-900 dark:text-slate-50">En Uygun İlan</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{result.overallStrategy}</p>
            </div>

            {/* Comparison Cards */}
            <div className="space-y-4 mb-6">
              {result.comparisons
                .sort((a, b) => b.matchScore - a.matchScore)
                .map((comparison, index) => {
                  const isBest = comparison.jobId === result.bestMatch;
                  return (
                    <div
                      key={comparison.jobId}
                      className={`card-elevated ${isBest ? "ring-2 ring-emerald-500" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {isBest && (
                              <span className="badge badge-success">En Uygun</span>
                            )}
                            <span className="text-sm text-slate-500">#{index + 1}</span>
                          </div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-50 mt-1">
                            {comparison.title || jobs.find((j) => j.id === comparison.jobId)?.title}
                          </h3>
                          {comparison.company && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{comparison.company}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(comparison.matchScore)}`}>
                            {comparison.matchScore}%
                          </p>
                          <p className="text-xs text-slate-500">Uyumluluk</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {comparison.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Güçlü Yönler</p>
                            <ul className="space-y-1">
                              {comparison.strengths.slice(0, 3).map((s, i) => (
                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="text-emerald-500">✓</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {comparison.gaps.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Eksikler</p>
                            <ul className="space-y-1">
                              {comparison.gaps.slice(0, 3).map((g, i) => (
                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5" />
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        {getEffortBadge(comparison.effort)}
                        <p className="text-sm text-slate-600 dark:text-slate-400">{comparison.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const best = result.comparisons.find((c) => c.jobId === result.bestMatch);
                  if (best) {
                    const job = jobs.find((j) => j.id === best.jobId);
                    if (job) {
                      sessionStorage.setItem("cvText", cvText);
                      sessionStorage.setItem("jobDescription", job.text);
                      router.push("/");
                    }
                  }
                }}
                className="btn-primary flex-1"
              >
                En Uygun İlan İçin CV Optimize Et
              </button>
              <button onClick={() => setResult(null)} className="btn-secondary flex-1">
                Yeni Karşılaştırma
              </button>
            </div>
          </>
        )}
    </div>
  );
}
