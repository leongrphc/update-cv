import { NextRequest, NextResponse } from "next/server";
import { reEnhanceCV } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  optimizedCV: z.string().min(1, "Optimize edilmiş CV gerekli").max(MAX_TEXT),
  jobDescription: z.string().min(1, "İş ilanı gerekli").max(MAX_TEXT),
  enhanceType: z.enum(["metrics", "summary", "keywords"]),
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
    const { optimizedCV, jobDescription, enhanceType, targetRole } = v.data;

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!hasOpenAI && !hasGoogle) {
      return NextResponse.json(
        { success: false, error: "API anahtarı yapılandırılmamış." },
        { status: 500 }
      );
    }

    const result = await reEnhanceCV(optimizedCV, jobDescription, enhanceType, targetRole);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Re-enhance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "CV güçlendirilirken hata oluştu",
      },
      { status: 500 }
    );
  }
}
