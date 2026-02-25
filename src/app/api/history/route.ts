import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch optimization history
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const optimizations = await prisma.optimization.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        jobPosting: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    const history = optimizations.map((opt) => ({
      id: opt.id,
      targetRole: opt.targetRole || opt.jobPosting.title,
      company: opt.jobPosting.company,
      atsScoreBefore: opt.atsScoreBefore,
      atsScoreAfter: opt.atsScoreAfter,
      createdAt: opt.createdAt.toISOString(),
      optimizedCV: opt.optimizedCV,
      originalCV: opt.originalCV,
      matchedKeywords: JSON.parse(opt.matchedKeywords || "[]"),
      addedKeywords: JSON.parse(opt.addedKeywords || "[]"),
      missingSkills: JSON.parse(opt.missingSkills || "[]"),
      improvements: JSON.parse(opt.improvements || "[]"),
    }));

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Geçmiş yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific optimization
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID gerekli" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const optimization = await prisma.optimization.findFirst({
      where: { id, userId: session.id },
    });

    if (!optimization) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.optimization.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History delete error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi başarısız" },
      { status: 500 }
    );
  }
}
