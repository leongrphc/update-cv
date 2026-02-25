import { NextRequest, NextResponse } from "next/server";
import { analyzeJob } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { success: false, error: "İş ilanı gerekli" },
        { status: 400 }
      );
    }

    const result = await analyzeJob(jobDescription);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Job analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "İlan analizi yapılırken hata oluştu",
      },
      { status: 500 }
    );
  }
}
