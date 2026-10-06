import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { hashResetToken } from "@/lib/password-reset";
import { isPasswordResetMailConfigured, passwordResetOrigin, sendPasswordResetEmail } from "@/lib/mail";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
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

    const { email } = v.data;
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && !isPasswordResetMailConfigured()) {
      return NextResponse.json({ success: false, error: "Şifre sıfırlama şu anda kullanılamıyor. Lütfen daha sonra deneyin." }, { status: 503 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing unused tokens for this user
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      // Create new reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashResetToken(token),
          expiresAt,
        },
      });

      // In dev mode, return the reset link
      const resetLink = `${passwordResetOrigin(request.nextUrl.origin)}/reset-password?token=${token}`;

      if (isDev) {
        return NextResponse.json({
          success: true,
          message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
          devResetLink: resetLink,
        });
      }

      await sendPasswordResetEmail(user.email, resetLink);
    }

    return NextResponse.json({
      success: true,
      message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
