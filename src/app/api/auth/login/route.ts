import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    // Şifre kontrolü
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    // Session oluştur
    await createSession({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
