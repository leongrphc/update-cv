import { NextResponse } from "next/server";
import { enhanceCVContent } from "@/lib/llm-client";

export async function POST(request: Request) {
  try {
    const { content, contentType, context } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json(
        { success: false, error: "content ve contentType gereklidir" },
        { status: 400 }
      );
    }

    const result = await enhanceCVContent(content, contentType, context);

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
