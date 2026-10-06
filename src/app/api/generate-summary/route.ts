import { NextRequest, NextResponse } from "next/server";
import { generateCVSummary } from "@/lib/llm-client";
import { getSession } from "@/lib/auth";
import { cvEditingOptionsSchema } from "@/lib/cv-editing-safety";
import { z } from "zod";

const schema = cvEditingOptionsSchema.extend({
  existingSummary: z.string().max(50_000).optional(),
  personalInfo: z.object({
    fullName: z.string().min(1, "Ad gerekli").max(200),
    title: z.string().min(1, "Ünvan gerekli").max(200),
    summary: z.string().max(50_000).optional(),
  }),
  experiences: z.array(z.object({
    position: z.string().max(200),
    company: z.string().max(200),
    bullets: z.array(z.string().max(10_000)).max(100),
    startDate: z.string().max(30).optional(),
    endDate: z.string().max(30).optional(),
    current: z.boolean().optional(),
  })).max(100).default([]),
  skills: z.object({
    technical: z.array(z.string().max(200)).max(200),
    soft: z.array(z.string().max(200)).max(200),
  }).default({ technical: [], soft: [] }),
});

export async function POST(request: NextRequest) {
  try {
    if (!await getSession()) {
      return NextResponse.json({ success: false, error: "CV özeti oluşturmak için giriş yapın." }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    // Bound the complete profile as well as individual fields to avoid oversized AI requests.
    if (JSON.stringify(v.data).length > 100_000) {
      return NextResponse.json({ success: false, error: "CV içeriği çok uzun." }, { status: 413 });
    }
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ success: false, error: "AI ile CV özeti oluşturma bağlantısı henüz yapılandırılmamış." }, { status: 503 });
    }
    const result = await generateCVSummary(
      v.data.personalInfo,
      v.data.experiences,
      v.data.skills,
      { cvLang: v.data.cvLang, targetRole: v.data.targetRole, existingSummary: v.data.existingSummary ?? v.data.personalInfo.summary },
    );

    return NextResponse.json({
      success: true,
      summary: result.summary,
      keywords: result.keywords,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Generate summary error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json(
      { success: false, error: "Özet oluşturma başarısız oldu" },
      { status: 502 }
    );
  }
}
