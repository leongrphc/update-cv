import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Kaydetmek için giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const { personalInfo, experiences, educations, skills, templateId, title } =
      await request.json();

    if (!personalInfo?.fullName) {
      return NextResponse.json(
        { success: false, error: "Kişisel bilgiler gereklidir" },
        { status: 400 }
      );
    }

    const createdCV = await prisma.createdCV.create({
      data: {
        userId: session.id,
        personalInfo: JSON.stringify(personalInfo),
        experiences: JSON.stringify(experiences || []),
        educations: JSON.stringify(educations || []),
        skills: JSON.stringify(skills || { technical: [], soft: [], languages: [], certifications: [] }),
        templateId: templateId || "modern",
        title: title || `${personalInfo.fullName} - CV`,
      },
    });

    return NextResponse.json({
      success: true,
      id: createdCV.id,
      message: "CV başarıyla kaydedildi",
    });
  } catch (error) {
    console.error("Save CV error:", error);
    return NextResponse.json(
      { success: false, error: "CV kaydetme başarısız oldu" },
      { status: 500 }
    );
  }
}
