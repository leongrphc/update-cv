"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  questionNumber: number;
  questionType: string;
  question: string;
  difficulty: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  sampleAnswer?: string;
}

interface Summary {
  overallScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  strongAreas: string[];
  improvementAreas: string[];
  generalFeedback: string;
  nextSteps: string[];
  allStrengths: string[];
  allImprovements: string[];
}

interface Session {
  targetRole: string;
  completedAt: string;
}

function InterviewResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/interview/${sessionId}`);
        if (!response.ok) throw new Error("Sonuçlar bulunamadı");

        const data = await response.json();
        setSession(data.session);
        setQuestions(data.questions);
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Mükemmel";
    if (score >= 75) return "İyi";
    if (score >= 60) return "Orta";
    if (score >= 40) return "Geliştirilmeli";
    return "Yetersiz";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "Sonuçlar bulunamadı"}</p>
          <button
            onClick={() => router.push("/interview")}
            className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
          >
            Yeni Mülakat Başlat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Mülakat Sonuçları
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {session?.targetRole} pozisyonu için mülakat simülasyonu
          </p>
        </div>

        {/* Score Card */}
        <div className={`${getScoreBgColor(summary.overallScore)} border border-slate-200 dark:border-slate-700 rounded-sm p-8 mb-8 text-center`}>
          <div className={`text-6xl font-bold ${getScoreColor(summary.overallScore)} mb-2`}>
            {Math.round(summary.overallScore)}
          </div>
          <div className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-4">
            {getScoreLabel(summary.overallScore)}
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {summary.generalFeedback}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.answeredQuestions}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Cevaplanan</div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalQuestions}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Toplam Soru</div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.strongAreas.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Güçlü Alan</div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.improvementAreas.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Gelişim Alanı</div>
          </div>
        </div>

        {/* Strong and Improvement Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-6">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4">
              Güçlü Alanlar
            </h3>
            <ul className="space-y-2">
              {summary.strongAreas.length > 0 ? (
                summary.strongAreas.map((area, i) => (
                  <li key={i} className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {area}
                  </li>
                ))
              ) : (
                <li className="text-green-600 dark:text-green-400">Henüz belirlenmedi</li>
              )}
            </ul>
            {summary.allStrengths && summary.allStrengths.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  Detaylı Güçlü Yönler:
                </h4>
                <ul className="space-y-1">
                  {summary.allStrengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-600 dark:text-green-400">
                      + {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-sm p-6">
            <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-4">
              Gelişim Alanları
            </h3>
            <ul className="space-y-2">
              {summary.improvementAreas.length > 0 ? (
                summary.improvementAreas.map((area, i) => (
                  <li key={i} className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {area}
                  </li>
                ))
              ) : (
                <li className="text-orange-600 dark:text-orange-400">Tüm alanlarda başarılı!</li>
              )}
            </ul>
            {summary.allImprovements && summary.allImprovements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-700">
                <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                  Detaylı İyileştirmeler:
                </h4>
                <ul className="space-y-1">
                  {summary.allImprovements.map((s, i) => (
                    <li key={i} className="text-sm text-orange-600 dark:text-orange-400">
                      ! {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-6 mb-8">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">
            Sonraki Adımlar
          </h3>
          <ul className="space-y-2">
            {summary.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <span className="font-bold">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Question Details */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm mb-8">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Soru Detayları
            </h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {questions.map((q) => (
              <div key={q.id} className="p-4">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-sm font-bold ${getScoreBgColor(q.score || 0)} ${getScoreColor(q.score || 0)}`}>
                      {q.score || "-"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {q.question}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Soru {q.questionNumber}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${expandedQuestion === q.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedQuestion === q.id && q.userAnswer && (
                  <div className="mt-4 pl-13 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-sm">
                      <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Cevabınız:
                      </h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {q.userAnswer}
                      </p>
                    </div>
                    {q.feedback && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Geri Bildirim:</strong> {q.feedback}
                      </p>
                    )}
                    {q.sampleAnswer && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-sm">
                        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Örnek Cevap:
                        </h5>
                        <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/interview"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors"
          >
            Yeni Mülakat Başlat
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
    </div>
  );
}

export default function InterviewResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <InterviewResultContent />
    </Suspense>
  );
}
