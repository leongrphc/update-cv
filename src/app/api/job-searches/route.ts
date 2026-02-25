import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch job search history
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const searches = await prisma.jobSearch.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        results: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            url: true,
            description: true,
          },
        },
      },
    });

    const jobSearches = searches.map((s) => ({
      id: s.id,
      keywords: s.keywords,
      location: s.location,
      jobType: s.jobType,
      resultCount: s.resultCount,
      searchedAt: s.createdAt.toISOString(),
      jobs: s.results,
    }));

    return NextResponse.json({ success: true, jobSearches });
  } catch (error) {
    console.error("Job search history fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Arama geçmişi yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Save a job search to history
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const { keywords, location, jobType, jobs } = await request.json();

    if (!keywords) {
      return NextResponse.json(
        { success: false, error: "Keywords gerekli" },
        { status: 400 }
      );
    }

    const jobSearch = await prisma.jobSearch.create({
      data: {
        userId: session.id,
        keywords,
        location: location || null,
        jobType: jobType || null,
        resultCount: jobs?.length || 0,
        results: {
          create: (jobs || []).slice(0, 10).map((job: {
            title?: string;
            company?: string;
            location?: string;
            jobType?: string;
            postedAt?: string;
            url?: string;
            description?: string;
            salary?: string;
            experienceLevel?: string;
            sector?: string;
          }) => ({
            title: job.title || "",
            company: job.company || "",
            location: job.location || "",
            jobType: job.jobType || null,
            postedAt: job.postedAt || null,
            url: job.url || null,
            description: job.description || null,
            salary: job.salary || null,
            experienceLevel: job.experienceLevel || null,
            sector: job.sector || null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, id: jobSearch.id });
  } catch (error) {
    console.error("Job search save error:", error);
    return NextResponse.json(
      { success: false, error: "Arama kaydedilirken hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job search
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

    // Verify ownership
    const search = await prisma.jobSearch.findFirst({
      where: { id, userId: session.id },
    });

    if (!search) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.jobSearch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job search delete error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi başarısız" },
      { status: 500 }
    );
  }
}
