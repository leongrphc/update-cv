import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInProfile } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  pdfText: z.string().min(1, "LinkedIn PDF metni gerekli").max(MAX_TEXT),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    // Parse LinkedIn profile using LLM
    const profile = await parseLinkedInProfile(v.data.pdfText);

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
