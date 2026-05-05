import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parsePagination, createPaginatedResponse } from "@/lib/pagination";

const postSchema = z.object({
  keywords: z.string().min(1, "Anahtar kelime gerekli").max(200),
  location: z.string().max(200).nullable().optional(),
  jobType: z.string().max(50).nullable().optional(),
  jobs: z.array(z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    jobType: z.string().optional(),
    postedAt: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
    description: z.string().optional(),
    salary: z.string().optional(),
    experienceLevel: z.string().optional(),
    sector: z.string().optional(),
  })).max(25).default([]),
});

const deleteSchema = z.object({
  id: z.string().min(1, "ID gerekli"),
});

// GET - Fetch job search history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * pageSize;

    const [searches, total] = await Promise.all([
      prisma.jobSearch.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
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
      }),
      prisma.jobSearch.count({ where: { userId: session.id } }),
    ]);

    const jobSearches = searches.map((s) => ({
      id: s.id,
      keywords: s.keywords,
      location: s.location,
      jobType: s.jobType,
      resultCount: s.resultCount,
      searchedAt: s.createdAt.toISOString(),
      jobs: s.results,
    }));

    return NextResponse.json({
      success: true,
      ...createPaginatedResponse(jobSearches, total, { page, pageSize }),
    });
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

    const body = await request.json();
    const v = postSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }
    const { keywords, location, jobType, jobs } = v.data;

    const jobSearch = await prisma.jobSearch.create({
      data: {
        userId: session.id,
        keywords,
        location: location || null,
        jobType: jobType || null,
        resultCount: jobs.length,
        results: {
          create: jobs.slice(0, 10).map((job) => ({
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
    const v = deleteSchema.safeParse({ id: searchParams.get("id") });
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify ownership
    const search = await prisma.jobSearch.findFirst({
      where: { id: v.data.id, userId: session.id },
    });

    if (!search) {
      return NextResponse.json(
        { success: false, error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.jobSearch.delete({ where: { id: v.data.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job search delete error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi başarısız" },
      { status: 500 }
    );
  }
}
