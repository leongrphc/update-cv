"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LinkedInMergeResult } from "@/types";

export default function LinkedInResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<LinkedInMergeResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("linkedinMergeResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/linkedin");
    }
  }, [router]);

  const handleCopy = async () => {
    if (result?.mergedCV) {
      await navigator.clipboard.writeText(result.mergedCV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.mergedCV) {
      const blob = new Blob([result.mergedCV], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-cv.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Profiller Birleştirildi!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            CV&apos;niz LinkedIn verileriyle zenginleştirildi.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {result.addedFromLinkedIn.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Eklenen Bilgi
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {result.enhancedSections.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Zenginleştirilen Bölüm
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {result.conflicts.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Çözülen Çatışma
            </div>
          </div>
        </div>

        {/* Added from LinkedIn */}
        {result.addedFromLinkedIn.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-6 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
              LinkedIn&apos;den Eklenen Bilgiler
            </h3>
            <ul className="space-y-2">
              {result.addedFromLinkedIn.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                  <span className="text-blue-500">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enhanced Sections */}
        {result.enhancedSections.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-6 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
              Zenginleştirilen Bölümler
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.enhancedSections.map((section, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-sm text-sm"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {result.conflicts.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-sm p-6 mb-6">
            <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-3">
              Çözülen Çatışmalar
            </h3>
            <div className="space-y-4">
              {result.conflicts.map((conflict, i) => (
                <div key={i} className="border-l-2 border-orange-400 pl-4">
                  <p className="font-medium text-orange-800 dark:text-orange-300">
                    {conflict.section}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-orange-600 dark:text-orange-400">CV: </span>
                      <span className="text-slate-600 dark:text-slate-400">{conflict.cvValue}</span>
                    </div>
                    <div>
                      <span className="text-orange-600 dark:text-orange-400">LinkedIn: </span>
                      <span className="text-slate-600 dark:text-slate-400">{conflict.linkedInValue}</span>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    <strong>Çözüm:</strong> {conflict.resolution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merged CV */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm mb-6">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Birleştirilmiş CV
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? "Kopyalandı!" : "Kopyala"}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
              >
                İndir
              </button>
            </div>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
              {result.mergedCV}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors"
          >
            CV&apos;yi Optimize Et
          </Link>
          <Link
            href="/linkedin"
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Yeniden Birleştir
          </Link>
        </div>
      </div>
    </div>
  );
}
