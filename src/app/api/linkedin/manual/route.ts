import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  profile: z.object({
    fullName: z.string().min(1, "Ad gerekli").max(200),
    headline: z.string().max(300).optional(),
    location: z.string().max(200).optional(),
    summary: z.string().max(5000).optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      startDate: z.string(),
      current: z.boolean(),
    })).default([]),
    education: z.array(z.object({ school: z.string() })).default([]),
    skills: z.array(z.string()).default([]),
    certifications: z.array(z.object({ name: z.string(), issuer: z.string() })).optional(),
    languages: z.array(z.object({ language: z.string(), proficiency: z.string() })).optional(),
  }),
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
    const { profile } = v.data;

    // Create LinkedIn profile from manual entry
    const linkedInProfile = await prisma.linkedInProfile.create({
      data: {
        fullName: profile.fullName,
        headline: profile.headline || null,
        location: profile.location || null,
        summary: profile.summary || null,
        experience: JSON.stringify(profile.experience),
        education: JSON.stringify(profile.education),
        skills: JSON.stringify(profile.skills),
        certifications: JSON.stringify(profile.certifications || []),
        languages: JSON.stringify(profile.languages || []),
        sourceType: "manual",
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: linkedInProfile.id,
        fullName: linkedInProfile.fullName,
        headline: linkedInProfile.headline,
        location: linkedInProfile.location,
        summary: linkedInProfile.summary,
        experience: JSON.parse(linkedInProfile.experience),
        education: JSON.parse(linkedInProfile.education),
        skills: JSON.parse(linkedInProfile.skills),
        certifications: linkedInProfile.certifications ? JSON.parse(linkedInProfile.certifications) : [],
        languages: linkedInProfile.languages ? JSON.parse(linkedInProfile.languages) : [],
        sourceType: linkedInProfile.sourceType,
      },
    });
  } catch (error) {
    console.error("LinkedIn manual entry error:", error);
    return NextResponse.json(
      { error: "Profil kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
