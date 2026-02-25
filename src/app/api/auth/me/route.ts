import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
});

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ success: false, user: null });
  }

  return NextResponse.json({ success: true, user });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const v = updateSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }
    const { name, email } = v.data;

    // Check for duplicate email if email changed
    if (email && email !== session.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: session.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "Bu e-posta adresi zaten kullanılıyor" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: name || session.name,
        email: email || session.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Kullanıcı güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}
