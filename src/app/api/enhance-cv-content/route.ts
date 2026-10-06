import { NextRequest, NextResponse } from "next/server";
import { enhanceCVContent } from "@/lib/llm-client";
import { getSession } from "@/lib/auth";
import { cvEditingOptionsSchema } from "@/lib/cv-editing-safety";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = cvEditingOptionsSchema.extend({
  content: z.string().min(1, "İçerik gerekli").max(MAX_TEXT),
  contentType: z.enum(["bullet", "summary", "title"]),
  context: z.string().max(MAX_TEXT).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!await getSession()) {
      return NextResponse.json({ success: false, error: "CV düzenlemek için giriş yapın." }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ success: false, error: "AI ile CV düzenleme bağlantısı henüz yapılandırılmamış." }, { status: 503 });
    }
    const result = await enhanceCVContent(v.data.content, v.data.contentType, v.data.context, {
      cvLang: v.data.cvLang, targetRole: v.data.targetRole,
    });

    return NextResponse.json({
      success: true,
      enhanced: result.enhanced,
      alternatives: result.alternatives,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Enhance CV content error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json(
      { success: false, error: "İçerik güçlendirme başarısız oldu" },
      { status: 502 }
    );
  }
}
