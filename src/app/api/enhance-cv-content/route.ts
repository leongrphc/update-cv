import { NextRequest, NextResponse } from "next/server";
import { enhanceCVContent } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  content: z.string().min(1, "İçerik gerekli").max(MAX_TEXT),
  contentType: z.enum(["bullet", "summary", "title"]),
  context: z.string().max(MAX_TEXT).optional(),
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

    const result = await enhanceCVContent(v.data.content, v.data.contentType, v.data.context);

    return NextResponse.json({
      success: true,
      enhanced: result.enhanced,
      alternatives: result.alternatives,
    });
  } catch (error) {
    console.error("Enhance CV content error:", error);
    return NextResponse.json(
      { success: false, error: "İçerik güçlendirme başarısız oldu" },
      { status: 500 }
    );
  }
}
