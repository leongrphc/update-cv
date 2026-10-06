import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "CV açmak için giriş yapın." }, { status: 401 });
  const { id } = await params;
  const cv = await prisma.createdCV.findFirst({ where: { id, userId: session.id } });
  if (!cv) return NextResponse.json({ success: false, error: "CV bulunamadı." }, { status: 404 });
  return NextResponse.json({ success: true, cv: { id: cv.id, title: cv.title || undefined,
    personalInfo: JSON.parse(cv.personalInfo), experiences: JSON.parse(cv.experiences),
    educations: JSON.parse(cv.educations), skills: JSON.parse(cv.skills), templateId: cv.templateId,
    cvLang: cv.cvLang, theme: cv.theme ? JSON.parse(cv.theme) : undefined,
        customSections: JSON.parse(cv.customSections || "[]"), targetRole: cv.targetRole || "", updatedAt: cv.updatedAt } });
}
