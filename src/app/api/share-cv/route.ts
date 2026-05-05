import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const schema = z.object({
  cvId: z.string().min(1),
  action: z.enum(["enable", "disable", "regenerate"]),
});

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
    const v = schema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { success: false, error: v.error.errors[0].message },
        { status: 400 }
      );
    }

    const { cvId, action } = v.data;

    // Verify ownership
    const cv = await prisma.createdCV.findFirst({
      where: { id: cvId, userId: session.id },
    });

    if (!cv) {
      return NextResponse.json(
        { success: false, error: "CV bulunamadı" },
        { status: 404 }
      );
    }

    if (action === "disable") {
      await prisma.createdCV.update({
        where: { id: cvId },
        data: { isPublic: false, shareToken: null },
      });
      return NextResponse.json({ success: true, shareToken: null, isPublic: false });
    }

    // enable or regenerate
    const newToken = randomUUID();
    await prisma.createdCV.update({
      where: { id: cvId },
      data: { isPublic: true, shareToken: newToken },
    });

    return NextResponse.json({ success: true, shareToken: newToken, isPublic: true });
  } catch (error) {
    console.error("Share CV error:", error);
    return NextResponse.json(
      { success: false, error: "İşlem sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
