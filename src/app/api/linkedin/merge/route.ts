import { NextRequest, NextResponse } from "next/server";
import { mergeProfiles } from "@/lib/llm-client";
import { z } from "zod";

const MAX_TEXT = 50_000;

const schema = z.object({
  cvText: z.string().min(1, "CV metni gerekli").max(MAX_TEXT),
  linkedInProfile: z.object({
    fullName: z.string().min(1),
    headline: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean(),
      description: z.string().optional(),
    })),
    education: z.array(z.object({
      school: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    })),
    skills: z.array(z.string()),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      issueDate: z.string().optional(),
      expiryDate: z.string().optional(),
      credentialId: z.string().optional(),
    })).optional(),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.enum(["elementary", "limited", "professional", "full", "native"]),
    })).optional(),
    extractedSections: z.array(z.string()),
  }),
  priority: z.enum(["cv", "linkedin", "balanced"]).default("balanced"),
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
    const { cvText, linkedInProfile, priority } = v.data;

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
