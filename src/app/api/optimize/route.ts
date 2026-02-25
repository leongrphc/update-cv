import { NextRequest, NextResponse } from "next/server";
import { optimizeCV } from "@/lib/llm-client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1).max(MAX_TEXT),
  jobDescription: z.string().min(1).max(MAX_TEXT),
  targetRole: z.string().max(200).optional(),
  options: z.object({
    mode: z.enum(["standard", "aggressive", "corporate", "startup"]),
    experienceLevel: z.enum(["intern", "junior", "mid", "senior", "lead"]),
    language: z.enum(["tr", "en"]),
    industry: z.enum(["tech", "finance", "health", "ecommerce", "consulting", "manufacturing", "other"]).optional(),
  }).optional(),
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
    const { cvText, jobDescription, targetRole, options } = v.data;

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!hasOpenAI && !hasGoogle) {
      return NextResponse.json(
        { success: false, error: "API anahtarı yapılandırılmamış. .env.local dosyasını kontrol edin." },
        { status: 500 }
      );
    }

    // Get current user session (optional - guests can also optimize)
    const session = await getSession();

    const result = await optimizeCV(cvText, jobDescription, targetRole, options);

    // Save to database
    try {
      // Create JobPosting record
      const jobPosting = await prisma.jobPosting.create({
        data: {
          title: targetRole || "Belirtilmemiş Pozisyon",
          description: jobDescription,
          requiredSkills: JSON.stringify(result.keywords?.matched || []),
          preferredSkills: JSON.stringify([]),
          keywords: JSON.stringify(result.keywords?.added || []),
        },
      });

      // Create Optimization record
      const optimization = await prisma.optimization.create({
        data: {
          userId: session?.id || null,
          jobPostingId: jobPosting.id,
          originalCV: cvText,
          optimizedCV: result.optimizedCV || "",
          atsScoreBefore: result.atsScore?.before || 0,
          atsScoreAfter: result.atsScore?.after || 0,
          matchedKeywords: JSON.stringify(result.keywords?.matched || []),
          addedKeywords: JSON.stringify(result.keywords?.added || []),
          missingSkills: JSON.stringify(result.keywords?.missing || []),
          improvements: JSON.stringify(result.improvements || []),
          targetRole: targetRole || null,
          roleAdaptations: result.roleAdaptations ? JSON.stringify(result.roleAdaptations) : null,
        },
      });

      // Auto-save as CVVersion
      if (session?.id && result.optimizedCV) {
        try {
          await prisma.cVVersion.create({
            data: {
              userId: session.id,
              label: `${targetRole || "CV"} - ${new Date().toLocaleDateString("tr-TR")}`,
              cvText: result.optimizedCV,
              sourceType: "optimization",
              sourceId: optimization.id,
              atsScore: result.atsScore?.after || null,
              targetRole: targetRole || null,
            },
          });
        } catch {
          // Version save failure shouldn't break the response
        }
      }

      return NextResponse.json({
        success: true,
        originalCV: cvText,
        optimizationId: optimization.id,
        ...result,
      });
    } catch (dbError) {
      // If database save fails, still return the result but log the error
      console.error("Database save error:", dbError);
      return NextResponse.json({
        success: true,
        originalCV: cvText,
        ...result,
      });
    }
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "CV optimize edilirken hata oluştu",
      },
      { status: 500 }
    );
  }
}
