import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1, "Token gerekli"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(128, "Şifre en fazla 128 karakter olmalı")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = v.data;

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz veya süresi dolmuş token. Lütfen yeni bir sıfırlama bağlantısı isteyin.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
