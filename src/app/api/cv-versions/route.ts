import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const versions = await prisma.cVVersion.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, versions });
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
    const { label, cvText, sourceType, sourceId, atsScore, targetRole } = body;

    if (!label || !cvText) {
      return NextResponse.json({ success: false, error: "Label ve CV metni gerekli" }, { status: 400 });
    }

    const version = await prisma.cVVersion.create({
      data: {
        userId: session.id,
        label,
        cvText,
        sourceType: sourceType || "manual",
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID gerekli" }, { status: 400 });
    }

    const version = await prisma.cVVersion.findFirst({
      where: { id, userId: session.id },
    });

    if (!version) {
      return NextResponse.json({ success: false, error: "Versiyon bulunamadı" }, { status: 404 });
    }

    await prisma.cVVersion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV version delete error:", error);
    return NextResponse.json({ success: false, error: "Silme işlemi başarısız" }, { status: 500 });
  }
}
