import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: session.id, isRead: false },
      }),
    ]);

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Notifications GET error:", error);
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
    const v = markReadSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const where = v.data.all
      ? { userId: session.id, isRead: false }
      : { userId: session.id, id: { in: v.data.ids || [] } };

    await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Notifications PUT error:", error);
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

    if (id) {
      const existing = await prisma.notification.findFirst({
        where: { id, userId: session.id },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Bildirim bulunamadı" },
          { status: 404 }
        );
      }
      await prisma.notification.delete({ where: { id } });
    } else {
      await prisma.notification.deleteMany({
        where: { userId: session.id, isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }
    console.error("Notifications DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
