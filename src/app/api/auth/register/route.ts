import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin").max(255),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(128, "Şifre en fazla 128 karakter olabilir")
    .regex(/[A-Z]/, "Şifre en az 1 büyük harf içermeli")
    .regex(/[a-z]/, "Şifre en az 1 küçük harf içermeli")
    .regex(/[0-9]/, "Şifre en az 1 rakam içermeli"),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // E-posta kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Bu e-posta adresi zaten kayıtlı" },
        { status: 400 }
      );
    }

    // Kullanıcı oluştur
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Session oluştur
    await createSession({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
