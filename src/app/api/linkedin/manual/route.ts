import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile } = body;

    if (!profile || !profile.fullName) {
      return NextResponse.json(
        { error: "Profil bilgileri gereklidir" },
        { status: 400 }
      );
    }

    // Create LinkedIn profile from manual entry
    const linkedInProfile = await prisma.linkedInProfile.create({
      data: {
        fullName: profile.fullName,
        headline: profile.headline || null,
        location: profile.location || null,
        summary: profile.summary || null,
        experience: JSON.stringify(profile.experience || []),
        education: JSON.stringify(profile.education || []),
        skills: JSON.stringify(profile.skills || []),
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
