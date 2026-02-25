import { NextRequest, NextResponse } from "next/server";
import { analyzeSkillGaps } from "@/lib/llm-client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1).max(MAX_TEXT),
  jobDescription: z.string().min(1).max(MAX_TEXT),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 },
      );
    }
    const { cvText, jobDescription } = v.data;

    const result = await analyzeSkillGaps(cvText, jobDescription);

    // Save skill gaps to database
    try {
      if (result.gaps && Array.isArray(result.gaps)) {
        const skillGapRecords = result.gaps.map(
          (gap: {
            skill: string;
            category: string;
            importance: string;
            learningPath?: {
              resources: string[];
              courses: string[];
              certifications: string[];
              estimatedTime: string;
            };
            workaround?: string;
          }) => ({
            missingSkill: gap.skill || "Bilinmeyen Beceri",
            category: gap.category || "technical",
            importance: gap.importance || "important",
            learningPath: gap.learningPath
              ? JSON.stringify(gap.learningPath)
              : null,
            estimatedTime: gap.learningPath?.estimatedTime || null,
          }),
        );

        await prisma.skillGap.createMany({
          data: skillGapRecords,
        });
      }
    } catch (dbError) {
      console.error("Database save error:", dbError);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Beceri analizi yapılırken hata oluştu",
      },
      { status: 500 },
    );
  }
}
