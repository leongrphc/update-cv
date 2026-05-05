import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePagination, createPaginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ success: true, cvs: [], createdCVs: [] });
    }

    const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * pageSize;

    // Fetch optimized CVs with pagination
    const [optimizations, optimizedTotal] = await Promise.all([
      prisma.optimization.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          jobPosting: {
            select: { title: true, company: true },
          },
        },
      }),
      prisma.optimization.count({ where: { userId: session.id } }),
    ]);

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

    // Fetch created CVs with pagination
    const [createdCVsRaw, createdTotal] = await Promise.all([
      prisma.createdCV.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.createdCV.count({ where: { userId: session.id } }),
    ]);

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
        shareToken: cv.shareToken,
        isPublic: cv.isPublic,
        personalInfo,
        experiences,
        educations,
        skills,
      };
    });

    return NextResponse.json({
      success: true,
      cvs: createPaginatedResponse(cvs, optimizedTotal, { page, pageSize }),
      createdCVs: createPaginatedResponse(createdCVs, createdTotal, { page, pageSize }),
    });
  } catch (error) {
    console.error("My CVs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "CV'ler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
