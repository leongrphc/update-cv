import { NextResponse } from "next/server";
import { generateCVSummary } from "@/lib/llm-client";

export async function POST(request: Request) {
  try {
    const { personalInfo, experiences, skills } = await request.json();

    if (!personalInfo?.fullName || !personalInfo?.title) {
      return NextResponse.json(
        { success: false, error: "Kişisel bilgiler gereklidir" },
        { status: 400 }
      );
    }

    const result = await generateCVSummary(
      personalInfo,
      experiences || [],
      skills || { technical: [], soft: [] }
    );

    return NextResponse.json({
      success: true,
      summary: result.summary,
      keywords: result.keywords,
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    return NextResponse.json(
      { success: false, error: "Özet oluşturma başarısız oldu" },
      { status: 500 }
    );
  }
}
