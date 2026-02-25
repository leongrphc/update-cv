import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInProfile } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfText } = body;

    if (!pdfText) {
      return NextResponse.json(
        { error: "LinkedIn PDF metni gereklidir" },
        { status: 400 }
      );
    }

    // Parse LinkedIn profile using LLM
    const profile = await parseLinkedInProfile(pdfText);

    return NextResponse.json({
      success: true,
      profile: {
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        summary: profile.summary,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        sourceType: "pdf",
      },
      extractedSections: profile.extractedSections,
    });
  } catch (error) {
    console.error("LinkedIn parse error:", error);
    return NextResponse.json(
      { error: "LinkedIn profili ayrıştırılırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
