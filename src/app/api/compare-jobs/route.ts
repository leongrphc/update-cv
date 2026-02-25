import { NextRequest, NextResponse } from "next/server";
import { compareJobs } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1).max(MAX_TEXT),
  jobs: z.array(z.object({
    id: z.string(),
    description: z.string().min(1).max(MAX_TEXT),
    title: z.string().optional(),
  })).min(2, "En az 2 iş ilanı gerekli").max(10, "En fazla 10 iş ilanı karşılaştırılabilir"),
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
    const { cvText, jobs } = v.data;

    const result = await compareJobs(cvText, jobs);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Job comparison error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "İlanlar karşılaştırılırken hata oluştu",
      },
      { status: 500 }
    );
  }
}
