"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  TrendingUp,
  Upload,
  LayoutGrid,
  RefreshCw,
  ArrowRight,
  Zap,
  Target,
  Clock,
  Loader2,
  Mail,
} from "lucide-react";

interface RecentOptimization {
  id: string;
  targetRole: string;
  company?: string | null;
  atsScoreBefore: number;
  atsScoreAfter: number;
  createdAt: string;
}

interface DashboardStats {
  totalOptimizations: number;
  totalCoverLetters: number;
  averageAtsImprovement: number;
  recentOptimizations: RecentOptimization[];
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOptimizations: 0,
    totalCoverLetters: 0,
    averageAtsImprovement: 0,
    recentOptimizations: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch {
        // Fallback to sessionStorage
        const result = sessionStorage.getItem("optimizationResult");
        if (result) {
          setStats((prev) => ({ ...prev, totalOptimizations: 1 }));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Kontrol Paneli
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Hoş geldiniz, bir sonraki işinizi bulalım.
          </p>
        </div>
        <Link
          href="/optimize"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Zap className="w-4 h-4" />
          Yeni Optimizasyon
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Toplam Optimizasyon
            </span>
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalOptimizations}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                CV versiyonları oluşturuldu
              </p>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Ön Yazılar
            </span>
            <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalCoverLetters}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Oluşturulan yazılar
              </p>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              ATS İyileştirme
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                +{stats.averageAtsImprovement}%
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Ortalama puan artışı
              </p>
            </>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Link
          href="/linkedin"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all"
        >
          <Upload className="w-7 h-7 text-slate-700 dark:text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Profil İçe Aktar / Güncelle
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            LinkedIn veya PDF&apos;ınızdan verilerinizi yenileyin.
            <br />
            Oluşturulan CV&apos;lerin doğru olması için temel bilgilerinizi güncel tutun.
          </p>
        </Link>

        <Link
          href="/create-cv"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all"
        >
          <LayoutGrid className="w-7 h-7 text-slate-700 dark:text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Temel CV Oluştur
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            ATS uyumlu standart bir CV oluşturun.
            <br />
            Özel iş optimizasyonu olmadan profil verilerinizden genel amaçlı bir özgeçmiş oluşturun.
          </p>
        </Link>

        <Link
          href="/optimize"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all"
        >
          <RefreshCw className="w-7 h-7 text-slate-700 dark:text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            İş İçin Optimize Et
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            CV&apos;nizi belirli bir pozisyon için özelleştirin.
            <br />
            AI destekli içerik ve anahtar kelime optimizasyonu için bir iş ilanı yapıştırın.
          </p>
        </Link>
      </div>

      {/* Recent CVs Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Son CV&apos;ler
          </h2>
          <Link
            href="/my-cvs"
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : stats.recentOptimizations.length > 0 ? (
          <div className="space-y-3">
            {stats.recentOptimizations.map((opt) => (
              <div
                key={opt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => {
                  router.push("/history");
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {opt.targetRole}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {opt.company && <span>{opt.company}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(opt.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">{opt.atsScoreBefore}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {opt.atsScoreAfter}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
              Henüz CV oluşturulmadı
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              Profilinizi içe aktararak ve ilk optimize edilmiş CV&apos;nizi oluşturarak başlayın.
            </p>
            <Link
              href="/optimize"
              className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Başla
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
