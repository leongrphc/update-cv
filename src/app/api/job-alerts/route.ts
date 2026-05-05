import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  keywords: z.string().min(1, "Anahtar kelime gerekli").max(200),
  location: z.string().max(200).optional(),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  keywords: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const alerts = await prisma.jobAlert.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { notifications: true } } },
    });
    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Job alerts GET error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const v = createSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const alert = await prisma.jobAlert.create({
      data: {
        userId: session.id,
        ...v.data,
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Job alerts POST error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const v = updateSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, ...data } = v.data;

    const existing = await prisma.jobAlert.findFirst({
      where: { id, userId: session.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Uyarı bulunamadı" },
        { status: 404 }
      );
    }

    const alert = await prisma.jobAlert.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Job alerts PUT error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID gerekli" },
        { status: 400 }
      );
    }

    const existing = await prisma.jobAlert.findFirst({
      where: { id, userId: session.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Uyarı bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.jobAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Job alerts DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
