import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parsePagination, createPaginatedResponse } from "@/lib/pagination";

const MAX_TEXT = 50_000;

const postSchema = z.object({
  label: z.string().min(1, "Etiket gerekli").max(200),
  cvText: z.string().min(1, "CV metni gerekli").max(MAX_TEXT),
  sourceType: z.enum(["optimization", "manual", "import"]).default("manual"),
  sourceId: z.string().optional(),
  atsScore: z.number().min(0).max(100).optional(),
  targetRole: z.string().max(200).optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1, "ID gerekli"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
    const skip = (page - 1) * pageSize;

    const [versions, total] = await Promise.all([
      prisma.cVVersion.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.cVVersion.count({ where: { userId: session.id } }),
    ]);

    return NextResponse.json({
      success: true,
      ...createPaginatedResponse(versions, total, { page, pageSize }),
    });
  } catch (error) {
    console.error("CV versions fetch error:", error);
    return NextResponse.json({ success: false, error: "Versiyonlar yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const body = await request.json();
    const v = postSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }
    const { label, cvText, sourceType, sourceId, atsScore, targetRole } = v.data;

    const version = await prisma.cVVersion.create({
      data: {
        userId: session.id,
        label,
        cvText,
        sourceType,
        sourceId: sourceId || null,
        atsScore: atsScore || null,
        targetRole: targetRole || null,
      },
    });

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error("CV version create error:", error);
    return NextResponse.json({ success: false, error: "Versiyon oluşturulamadı" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const v = deleteSchema.safeParse({ id: searchParams.get("id") });
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const version = await prisma.cVVersion.findFirst({
      where: { id: v.data.id, userId: session.id },
    });

    if (!version) {
      return NextResponse.json({ success: false, error: "Versiyon bulunamadı" }, { status: 404 });
    }

    await prisma.cVVersion.delete({ where: { id: v.data.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV version delete error:", error);
    return NextResponse.json({ success: false, error: "Silme işlemi başarısız" }, { status: 500 });
  }
}
