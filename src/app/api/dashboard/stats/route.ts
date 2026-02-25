import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: true,
        stats: {
          totalOptimizations: 0,
          totalCoverLetters: 0,
          averageAtsImprovement: 0,
          recentOptimizations: [],
        },
      });
    }

    const [totalOptimizations, totalCoverLetters, optimizations, recentOptimizations] =
      await Promise.all([
        prisma.optimization.count({ where: { userId: session.id } }),
        prisma.coverLetter.count({ where: { userId: session.id } }),
        prisma.optimization.findMany({
          where: { userId: session.id },
          select: { atsScoreBefore: true, atsScoreAfter: true },
        }),
        prisma.optimization.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            targetRole: true,
            atsScoreBefore: true,
            atsScoreAfter: true,
            createdAt: true,
            jobPosting: {
              select: { title: true, company: true },
            },
          },
        }),
      ]);

    const averageAtsImprovement =
      optimizations.length > 0
        ? Math.round(
            optimizations.reduce((sum, o) => sum + (o.atsScoreAfter - o.atsScoreBefore), 0) /
              optimizations.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalOptimizations,
        totalCoverLetters,
        averageAtsImprovement,
        recentOptimizations: recentOptimizations.map((o) => ({
          id: o.id,
          targetRole: o.targetRole || o.jobPosting.title,
          company: o.jobPosting.company,
          atsScoreBefore: o.atsScoreBefore,
          atsScoreAfter: o.atsScoreAfter,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "İstatistikler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
