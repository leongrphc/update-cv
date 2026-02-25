"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Question {
  id: string;
  questionNumber: number;
  questionType: string;
  question: string;
  expectedTopics: string[];
  difficulty: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  sampleAnswer?: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  isLastQuestion: boolean;
  overallScore?: number;
}

function InterviewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/interview/${sessionId}`);
        if (!response.ok) throw new Error("Oturum bulunamadı");

        const data = await response.json();
        setQuestions(data.questions);
        setTargetRole(data.session.targetRole);

        const unansweredIndex = data.questions.findIndex((q: Question) => !q.userAnswer);
        setCurrentIndex(unansweredIndex >= 0 ? unansweredIndex : data.questions.length - 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentIndex].id,
          answer,
        }),
      });

      if (!response.ok) throw new Error("Değerlendirme hatası");

      const result = await response.json();
      setEvaluation(result);

      // Update local question state
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        userAnswer: answer,
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        sampleAnswer: result.sampleAnswer,
      };
      setQuestions(updatedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (evaluation?.isLastQuestion) {
      router.push(`/interview/result?id=${sessionId}`);
    } else {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
      setEvaluation(null);
    }
  };

  const currentQuestion = questions[currentIndex];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Mülakat yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      technical: "Teknik",
      behavioral: "Davranışsal",
      situational: "Durumsal",
      competency: "Yetkinlik",
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {targetRole} - Mülakat
            </h1>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Soru {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + (evaluation ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-sm ${getDifficultyColor(currentQuestion?.difficulty)}`}>
              {currentQuestion?.difficulty === "easy" ? "Kolay" : currentQuestion?.difficulty === "medium" ? "Orta" : "Zor"}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">
              {getTypeLabel(currentQuestion?.questionType)}
            </span>
          </div>

          <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-4">
            {currentQuestion?.question}
          </h2>

          {!evaluation ? (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Cevabınızı buraya yazın. STAR metodunu kullanmayı unutmayın (Durum, Görev, Eylem, Sonuç)..."
                rows={8}
                disabled={isEvaluating}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {answer.length} karakter
                </span>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isEvaluating}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Değerlendiriliyor...
                    </>
                  ) : (
                    "Cevabı Gönder"
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* User's Answer */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-sm">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Cevabınız:
                </h4>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {answer}
                </p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Puan</div>
                </div>
                <div className="flex-1 pl-4 border-l border-slate-200 dark:border-slate-600">
                  <p className="text-slate-700 dark:text-slate-300">{evaluation.feedback}</p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Güçlü Yönler
                  </h4>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                        <span>+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-sm p-4">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
                    Geliştirilecek Alanlar
                  </h4>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-orange-700 dark:text-orange-400 flex items-start gap-2">
                        <span>!</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sample Answer */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Örnek Cevap
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                  {evaluation.sampleAnswer}
                </p>
              </div>

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors"
                >
                  {evaluation.isLastQuestion ? "Sonuçları Gör" : "Sonraki Soru"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm">
            {error}
          </div>
        )}
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <InterviewSessionContent />
    </Suspense>
  );
}
