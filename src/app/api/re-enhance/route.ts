import { NextRequest, NextResponse } from "next/server";
import { reEnhanceCV } from "@/lib/llm-client";
import type { EnhanceType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { optimizedCV, jobDescription, enhanceType, targetRole } = body;

    if (!optimizedCV || !jobDescription || !enhanceType) {
      return NextResponse.json(
        { success: false, error: "Optimize edilmiş CV, iş ilanı ve güçlendirme tipi gerekli" },
        { status: 400 }
      );
    }

    const validTypes: EnhanceType[] = ["metrics", "summary", "keywords"];
    if (!validTypes.includes(enhanceType)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz güçlendirme tipi" },
        { status: 400 }
      );
    }

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
