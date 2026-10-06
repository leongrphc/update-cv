import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cvThemeSchema } from "@/lib/cv-theme";

const schema = z.object({
  id: z.string().min(1).optional(),
  cvLang: z.enum(["tr", "en"]).default("tr"),
  theme: cvThemeSchema.optional(),
  customSections: z.array(z.object({ id: z.string().min(1), title: z.string().max(200), content: z.string().max(50_000) })).max(20).optional(),
  targetRole: z.string().max(200).optional(),
  personalInfo: z.object({
    fullName: z.string().trim().min(1, "Ad gerekli").max(200),
    title: z.string().optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
    summary: z.string().max(50_000).optional(),
  }),
  experiences: z.array(z.object({
    id: z.string().optional(),
    position: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    bullets: z.array(z.string()),
  })).default([]),
  educations: z.array(z.object({
    id: z.string().optional(),
    school: z.string(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
    description: z.string().optional(),
  })).default([]),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    languages: z.array(z.object({
      id: z.string(),
      language: z.string(),
      level: z.enum(["", "A1", "A2", "B1", "B2", "C1", "C2", "Ana Dil"]),
    })).default([]),
    certifications: z.array(z.object({
      id: z.string(),
      name: z.string(),
      issuer: z.string(),
      date: z.string().optional(),
    })).default([]),
  }).default({ technical: [], soft: [] }),
  templateId: z.enum(["modern", "classic", "creative", "executive", "minimal", "diamond"]).default("modern"),
  title: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Kaydetmek için giriş yapmanız gerekiyor" },
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
    const { id, cvLang, theme, customSections, targetRole, personalInfo, experiences, educations, skills, templateId, title } = v.data;

    const data = {
      ...(customSections ? { customSections: JSON.stringify(customSections) } : {}),
      ...(targetRole !== undefined ? { targetRole } : {}),
      personalInfo: JSON.stringify(personalInfo),
      experiences: JSON.stringify(experiences),
      educations: JSON.stringify(educations),
      skills: JSON.stringify(skills),
      templateId,
      cvLang,
      ...(theme ? { theme: JSON.stringify(theme) } : {}),
      title: title || `${personalInfo.fullName} - CV`,
    };
    let savedId = id;
    if (id) {
      const updated = await prisma.createdCV.updateMany({ where: { id, userId: session.id }, data });
      if (updated.count !== 1) {
        return NextResponse.json({ success: false, error: "CV bulunamadı" }, { status: 404 });
      }
    } else {
      const createdCV = await prisma.createdCV.create({ data: { ...data, userId: session.id } });
      savedId = createdCV.id;
    }

    return NextResponse.json({
      success: true,
      id: savedId,
      message: "CV başarıyla kaydedildi",
    });
  } catch (error) {
    console.error("Save CV error:", error);
    return NextResponse.json(
      { success: false, error: "CV kaydetme başarısız oldu" },
      { status: 500 }
    );
  }
}
