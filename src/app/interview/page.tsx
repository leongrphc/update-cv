"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";

export default function InterviewPage() {
  const router = useRouter();
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartInterview = async () => {
    if (!cvText || !jobDescription) {
      setError("CV ve iş ilanı gereklidir");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription,
          targetRole: targetRole || undefined,
          questionCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Bir hata oluştu");
      }

      const data = await response.json();
      router.push(`/interview/session?id=${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            AI Mülakat Simülasyonu
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            CV&apos;nizi ve hedef iş ilanını yükleyin, AI size pozisyona özel mülakat soruları hazırlasın.
          </p>
        </div>

        <div className="space-y-6">
          {/* CV Upload */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              1. CV Yükle
            </h2>
            <FileUpload
              onTextExtracted={(text) => setCvText(text)}
              label="CV PDF'inizi sürükleyip bırakın"
            />
            {cvText && (
              <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">CV yüklendi ({cvText.length} karakter)</span>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              2. İş İlanı
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="İş ilanının tam metnini buraya yapıştırın..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              3. Simülasyon Ayarları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hedef Pozisyon (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="örn: Senior Frontend Developer"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Boş bırakırsanız iş ilanından otomatik çıkarılır
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Soru Sayısı
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3}>3 Soru (Kısa)</option>
                  <option value={5}>5 Soru (Standart)</option>
                  <option value={7}>7 Soru (Detaylı)</option>
                  <option value={10}>10 Soru (Kapsamlı)</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={!cvText || !jobDescription || isLoading}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Sorular Hazırlanıyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mülakatı Başlat
              </>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Nasıl Çalışır?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              AI, CV&apos;nizi ve iş ilanını analiz ederek pozisyona özel sorular hazırlar
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              Her soruyu yazılı olarak cevaplarsınız
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              AI cevabınızı değerlendirir, puan verir ve geri bildirim sağlar
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              Sonunda genel performans raporunuzu görürsünüz
            </li>
          </ul>
        </div>
      </div>
  );
}
