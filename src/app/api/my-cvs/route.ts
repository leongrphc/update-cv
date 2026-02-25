import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ success: true, cvs: [], createdCVs: [] });
    }

    // Fetch optimized CVs
    const optimizations = await prisma.optimization.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        jobPosting: {
          select: { title: true, company: true },
        },
      },
    });

    const cvs = optimizations.map((opt) => ({
      id: opt.id,
      type: "optimized" as const,
      targetRole: opt.targetRole || opt.jobPosting.title,
      company: opt.jobPosting.company,
      atsScoreBefore: opt.atsScoreBefore,
      atsScoreAfter: opt.atsScoreAfter,
      createdAt: opt.createdAt.toISOString(),
      optimizedCV: opt.optimizedCV,
      originalCV: opt.originalCV,
    }));

    // Fetch created CVs
    const createdCVsRaw = await prisma.createdCV.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    const createdCVs = createdCVsRaw.map((cv) => {
      const personalInfo = JSON.parse(cv.personalInfo);
      const experiences = JSON.parse(cv.experiences);
      const educations = JSON.parse(cv.educations);
      const skills = JSON.parse(cv.skills);
      return {
        id: cv.id,
        type: "created" as const,
        title: cv.title || `${personalInfo.fullName} - CV`,
        fullName: personalInfo.fullName,
        professionalTitle: personalInfo.title,
        templateId: cv.templateId,
        experienceCount: experiences.length,
        educationCount: educations.length,
        skillCount: skills.technical?.length || 0,
        createdAt: cv.createdAt.toISOString(),
        updatedAt: cv.updatedAt.toISOString(),
        // Full data for edit/download
        personalInfo,
        experiences,
        educations,
        skills,
      };
    });

    return NextResponse.json({ success: true, cvs, createdCVs });
  } catch (error) {
    console.error("My CVs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "CV'ler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
