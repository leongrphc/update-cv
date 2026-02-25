import { NextRequest, NextResponse } from "next/server";
import { mergeProfiles } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvText, linkedInProfile, priority = "balanced" } = body;

    if (!cvText || !linkedInProfile) {
      return NextResponse.json(
        { error: "CV metni ve LinkedIn profili gereklidir" },
        { status: 400 }
      );
    }

    // Validate priority
    if (!["cv", "linkedin", "balanced"].includes(priority)) {
      return NextResponse.json(
        { error: "Geçersiz öncelik değeri" },
        { status: 400 }
      );
    }

    // Merge profiles using LLM
    const result = await mergeProfiles(cvText, linkedInProfile, priority);

    return NextResponse.json({
      success: true,
      mergedCV: result.mergedCV,
      addedFromLinkedIn: result.addedFromLinkedIn,
      enhancedSections: result.enhancedSections,
      conflicts: result.conflicts,
    });
  } catch (error) {
    console.error("LinkedIn merge error:", error);
    return NextResponse.json(
      { error: "Profiller birleştirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
