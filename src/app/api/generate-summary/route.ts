import { NextRequest, NextResponse } from "next/server";
import { generateCVSummary } from "@/lib/llm-client";
import { z } from "zod";

const schema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Ad gerekli"),
    title: z.string().min(1, "Ünvan gerekli"),
  }),
  experiences: z.array(z.object({
    position: z.string(),
    company: z.string(),
    bullets: z.array(z.string()),
  })).default([]),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
  }).default({ technical: [], soft: [] }),
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

    const result = await generateCVSummary(
      v.data.personalInfo,
      v.data.experiences,
      v.data.skills
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
