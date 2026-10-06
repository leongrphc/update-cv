import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { hashResetToken } from "@/lib/password-reset";

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Geçersiz sıfırlama bağlantısı"),
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
        token: hashResetToken(token),
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

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordReset.updateMany({
        where: { id: resetRecord.id, used: false, expiresAt: { gt: new Date() } },
        data: { used: true },
      });
      if (claimed.count !== 1) throw new Error("INVALID_RESET_TOKEN");
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return NextResponse.json({ success: false, error: "Bu bağlantı kullanılmış veya süresi dolmuş." }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
