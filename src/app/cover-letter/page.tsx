"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import type { CoverLetterResult } from "@/types";

export default function CoverLetterPage() {
  const router = useRouter();
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("coverLetterResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("coverLetterResult");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem("coverLetterResult");
    router.push("/");
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Ön Yazı Oluşturuldu
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-13">
            İş ilanına özel profesyonel ön yazınız hazır.
          </p>
        </div>

        {/* Highlights */}
        <div className="card-elevated mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-medium text-slate-900 dark:text-slate-100">Vurgulanan Deneyimler</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.highlights.map((highlight, index) => (
              <span key={index} className="badge badge-info">
                {highlight}
              </span>
            ))}
          </div>
        </div>

        {/* Cover Letter */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">Ön Yazı</h2>
            <button
              onClick={handleCopy}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopyala
                </>
              )}
            </button>
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-sm border border-slate-200 dark:border-slate-700">
              {result.coverLetter}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-sm">
          <p className="text-sm text-blue-700">
            <strong>Önerilen Kapanış:</strong> {result.callToAction}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={handleCopy}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Ön Yazıyı Kopyala
          </button>
          <button onClick={handleBack} className="btn-secondary flex-1">
            Yeni Ön Yazı Oluştur
          </button>
        </div>
    </div>
  );
}
