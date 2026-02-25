import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateInterviewAnswer } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answer } = body;

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: "Session ID, soru ID ve cevap gereklidir" },
        { status: 400 }
      );
    }

    // Get session and question
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

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Soru bulunamadı" },
        { status: 404 }
      );
    }

    // Evaluate answer using LLM
    const evaluation = await evaluateInterviewAnswer(
      question.question,
      JSON.parse(question.expectedTopics),
      answer,
      session.cvText,
      session.jobDescription
    );

    // Update question with answer and evaluation
    await prisma.interviewQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: JSON.stringify(evaluation.strengths),
        improvements: JSON.stringify(evaluation.improvements),
        sampleAnswer: evaluation.sampleAnswer,
        answeredAt: new Date(),
      },
    });

    // Update session current question
    const answeredCount = session.questions.filter((q) => q.userAnswer !== null).length + 1;
    const isLastQuestion = answeredCount >= session.totalQuestions;

    // Calculate overall score if last question
    let overallScore: number | undefined;
    if (isLastQuestion) {
      const allScores = session.questions
        .filter((q) => q.score !== null)
        .map((q) => q.score as number);
      allScores.push(evaluation.score);
      overallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          currentQuestion: answeredCount,
          status: "completed",
          overallScore,
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          currentQuestion: answeredCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      sampleAnswer: evaluation.sampleAnswer,
      isLastQuestion,
      overallScore,
      answeredCount,
      totalQuestions: session.totalQuestions,
    });
  } catch (error) {
    console.error("Interview evaluate error:", error);
    return NextResponse.json(
      { error: "Cevap değerlendirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
