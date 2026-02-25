import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Mülakat oturumu bulunamadı" },
        { status: 404 }
      );
    }

    // Transform questions
    const questions = session.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionType: q.questionType,
      question: q.question,
      expectedTopics: JSON.parse(q.expectedTopics),
      difficulty: q.difficulty,
      userAnswer: q.userAnswer,
      score: q.score,
      feedback: q.feedback,
      strengths: q.strengths ? JSON.parse(q.strengths) : null,
      improvements: q.improvements ? JSON.parse(q.improvements) : null,
      sampleAnswer: q.sampleAnswer,
      answeredAt: q.answeredAt,
    }));

    // Generate summary if completed
    let summary = null;
    if (session.status === "completed") {
      const answeredQuestions = questions.filter((q) => q.userAnswer);
      const scores = answeredQuestions.map((q) => q.score).filter((s): s is number => s !== null);

      const allStrengths = answeredQuestions
        .flatMap((q) => q.strengths || [])
        .filter((s, i, arr) => arr.indexOf(s) === i);

      const allImprovements = answeredQuestions
        .flatMap((q) => q.improvements || [])
        .filter((s, i, arr) => arr.indexOf(s) === i);

      // Determine strong and weak areas by question type
      const typeScores: Record<string, number[]> = {};
      answeredQuestions.forEach((q) => {
        if (q.score !== null) {
          if (!typeScores[q.questionType]) {
            typeScores[q.questionType] = [];
          }
          typeScores[q.questionType].push(q.score);
        }
      });

      const typeAverages = Object.entries(typeScores).map(([type, scores]) => ({
        type,
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const strongAreas = typeAverages
        .filter((t) => t.average >= 75)
        .map((t) => getTypeLabel(t.type));

      const improvementAreas = typeAverages
        .filter((t) => t.average < 75)
        .map((t) => getTypeLabel(t.type));

      summary = {
        overallScore: session.overallScore || 0,
        totalQuestions: session.totalQuestions,
        answeredQuestions: answeredQuestions.length,
        strongAreas,
        improvementAreas,
        generalFeedback: generateGeneralFeedback(session.overallScore || 0),
        nextSteps: generateNextSteps(session.overallScore || 0, improvementAreas),
        allStrengths: allStrengths.slice(0, 5),
        allImprovements: allImprovements.slice(0, 5),
      };
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        targetRole: session.targetRole,
        status: session.status,
        totalQuestions: session.totalQuestions,
        currentQuestion: session.currentQuestion,
        overallScore: session.overallScore,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
      },
      questions,
      summary,
    });
  } catch (error) {
    console.error("Interview session get error:", error);
    return NextResponse.json(
      { error: "Oturum bilgileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    technical: "Teknik Sorular",
    behavioral: "Davranışsal Sorular",
    situational: "Durumsal Sorular",
    competency: "Yetkinlik Soruları",
  };
  return labels[type] || type;
}

function generateGeneralFeedback(score: number): string {
  if (score >= 90) {
    return "Mükemmel bir performans sergilediniz! Cevaplarınız kapsamlı, yapılandırılmış ve profesyoneldi.";
  } else if (score >= 75) {
    return "İyi bir performans gösterdiniz. Cevaplarınız genel olarak tatmin edici, küçük iyileştirmelerle daha da güçlenebilir.";
  } else if (score >= 60) {
    return "Orta düzeyde bir performans. Bazı alanlarda güçlü cevaplar verdiniz ancak geliştirilmesi gereken noktalar var.";
  } else {
    return "Geliştirilmesi gereken alanlar mevcut. Özellikle STAR metodunu kullanarak cevaplarınızı yapılandırmaya odaklanın.";
  }
}

function generateNextSteps(score: number, weakAreas: string[]): string[] {
  const steps: string[] = [];

  if (score < 90) {
    steps.push("STAR metodunu (Durum, Görev, Eylem, Sonuç) kullanarak cevaplarınızı yapılandırın");
  }

  if (weakAreas.includes("Teknik Sorular")) {
    steps.push("Teknik konularda daha fazla pratik yapın ve güncel teknolojileri takip edin");
  }

  if (weakAreas.includes("Davranışsal Sorular")) {
    steps.push("Geçmiş deneyimlerinizden somut örnekler hazırlayın");
  }

  if (score < 75) {
    steps.push("Mock interview'lar ile pratik yaparak özgüveninizi artırın");
  }

  steps.push("Bu simülasyonu farklı pozisyonlar için tekrarlayarak deneyim kazanın");

  return steps;
}
