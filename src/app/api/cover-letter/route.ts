import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/llm-client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1).max(MAX_TEXT),
  jobDescription: z.string().min(1).max(MAX_TEXT),
  tone: z.enum(["professional", "enthusiastic", "formal"]).default("professional"),
  targetRole: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }
    const { cvText, jobDescription, tone, targetRole } = v.data;

    // Get current user session (optional)
    const session = await getSession();

    const result = await generateCoverLetter(cvText, jobDescription, tone);

    // Save to database
    try {
      // Create or find JobPosting
      const jobPosting = await prisma.jobPosting.create({
        data: {
          title: targetRole || "Belirtilmemiş Pozisyon",
          description: jobDescription,
          requiredSkills: JSON.stringify([]),
          preferredSkills: JSON.stringify([]),
          keywords: JSON.stringify([]),
        },
      });

      // Create CoverLetter record
      const coverLetter = await prisma.coverLetter.create({
        data: {
          userId: session?.id || null,
          jobPostingId: jobPosting.id,
          content: result.coverLetter || "",
          tone: tone,
        },
      });

      return NextResponse.json({
        success: true,
        coverLetterId: coverLetter.id,
        ...result,
      });
    } catch (dbError) {
      console.error("Database save error:", dbError);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }
  } catch (error) {
    console.error("Cover letter generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ön yazı oluşturulurken hata oluştu",
      },
      { status: 500 }
    );
  }
}
