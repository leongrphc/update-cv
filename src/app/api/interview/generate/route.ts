import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestions } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1).max(MAX_TEXT),
  jobDescription: z.string().min(1).max(MAX_TEXT),
  targetRole: z.string().max(200).optional(),
  questionCount: z.union([z.literal(3), z.literal(5), z.literal(7), z.literal(10)]).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { error: v.error.errors[0].message },
        { status: 400 }
      );
    }
    const { cvText, jobDescription, targetRole, questionCount } = v.data;

    // Generate interview questions using LLM
    const result = await generateInterviewQuestions(
      cvText,
      jobDescription,
      targetRole,
      questionCount
    );

    // Create interview session in database
    const session = await prisma.interviewSession.create({
      data: {
        cvText,
        jobDescription,
        targetRole: result.targetRole,
        totalQuestions: result.questions.length,
        currentQuestion: 0,
        status: "in_progress",
        questions: {
          create: result.questions.map((q) => ({
            questionNumber: q.questionNumber,
            questionType: q.questionType,
            question: q.question,
            expectedTopics: JSON.stringify(q.expectedTopics),
            difficulty: q.difficulty,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
      },
    });

    // Transform questions for response
    const transformedQuestions = session.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionType: q.questionType,
      question: q.question,
      expectedTopics: JSON.parse(q.expectedTopics),
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      targetRole: session.targetRole,
      totalQuestions: session.totalQuestions,
      questions: transformedQuestions,
    });
  } catch (error) {
    console.error("Interview generate error:", error);
    return NextResponse.json(
      { error: "Mülakat soruları oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
