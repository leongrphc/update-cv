import { prisma } from "@/lib/prisma";
import { PublicCVRenderer } from "@/components/share/PublicCVRenderer";
import type { CVPersonalInfo, CVExperienceEntry, CVEducationEntry, CVSkillsData } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const cv = await prisma.createdCV.findFirst({
    where: { shareToken: token, isPublic: true },
  });

  if (!cv) return { title: "CV Bulunamadı" };

  const personalInfo = JSON.parse(cv.personalInfo) as CVPersonalInfo;
  return {
    title: `${personalInfo.fullName} - CV`,
    description: `${personalInfo.fullName} - ${personalInfo.title || "CV"}`,
  };
}

export default async function ShareCVPage({ params }: Props) {
  const { token } = await params;
  const cv = await prisma.createdCV.findFirst({
    where: { shareToken: token, isPublic: true },
  });

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CV Bulunamadı</h1>
          <p className="text-gray-500">
            Bu CV paylaşıma kapatılmış veya geçersiz bir bağlantı kullanıyorsunuz.
          </p>
        </div>
      </div>
    );
  }

  const personalInfo = JSON.parse(cv.personalInfo) as CVPersonalInfo;
  const experiences = JSON.parse(cv.experiences) as CVExperienceEntry[];
  const educations = JSON.parse(cv.educations) as CVEducationEntry[];
  const skills = JSON.parse(cv.skills) as CVSkillsData;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <PublicCVRenderer
        personalInfo={personalInfo}
        experiences={experiences}
        educations={educations}
        skills={skills}
      />
    </div>
  );
}
