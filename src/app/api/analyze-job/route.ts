import { NextRequest, NextResponse } from "next/server";
import { analyzeJob } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  jobDescription: z.string().min(1, "İş ilanı gerekli").max(MAX_TEXT),
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

    const result = await analyzeJob(v.data.jobDescription);

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
