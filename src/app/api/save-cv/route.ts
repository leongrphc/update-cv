import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Ad gerekli"),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  experiences: z.array(z.object({
    position: z.string(),
    company: z.string(),
    bullets: z.array(z.string()),
  })).default([]),
  educations: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
  })).default([]),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    languages: z.array(z.object({})).optional(),
    certifications: z.array(z.object({})).optional(),
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
    const { personalInfo, experiences, educations, skills, templateId, title } = v.data;

    const createdCV = await prisma.createdCV.create({
      data: {
        userId: session.id,
        personalInfo: JSON.stringify(personalInfo),
        experiences: JSON.stringify(experiences),
        educations: JSON.stringify(educations),
        skills: JSON.stringify(skills),
        templateId,
        title: title || `${personalInfo.fullName} - CV`,
      },
    });

    return NextResponse.json({
      success: true,
      id: createdCV.id,
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
