import type { CreateCVFormData } from "@/types";

export interface CVSectionScore {
  label: string;
  score: number;
  max: number;
  missing: string[];
}

export interface CVCompletenessScore {
  total: number;
  sections: CVSectionScore[];
  tips: string[];
}

function scorePersonalInfo(data: CreateCVFormData): CVSectionScore {
  const p = data.personalInfo;
  const missing: string[] = [];
  let score = 0;

  if (p.fullName) score += 5;
  else missing.push("Ad Soyad");

  if (p.title) score += 5;
  else missing.push("Unvan / Pozisyon");

  if (p.email) score += 4;
  else missing.push("E-posta");

  if (p.phone) score += 4;
  else missing.push("Telefon");

  if (p.location) score += 3;
  else missing.push("Konum");

  if (p.summary && p.summary.length >= 50) score += 4;
  else if (p.summary) score += 2;
  else missing.push("Profesyonel Özet");

  return { label: "Kişisel Bilgiler", score, max: 25, missing };
}

function scoreExperience(data: CreateCVFormData): CVSectionScore {
  const missing: string[] = [];
  let score = 0;

  if (data.experiences.length === 0) {
    return {
      label: "Deneyim",
      score: 0,
      max: 25,
      missing: ["En az 1 iş deneyimi ekleyin"],
    };
  }

  score += 5; // Has at least one entry

  const hasPositionAndCompany = data.experiences.every(
    (e) => e.position && e.company
  );
  if (hasPositionAndCompany) score += 5;
  else missing.push("Tüm deneyimlerde pozisyon ve şirket adı olmalı");

  const totalBullets = data.experiences.reduce(
    (sum, e) => sum + e.bullets.filter((b) => b.trim()).length,
    0
  );
  if (totalBullets >= 5) score += 10;
  else if (totalBullets >= 3) score += 7;
  else if (totalBullets >= 1) score += 4;
  else missing.push("Deneyim maddeleri ekleyin");

  const hasDates = data.experiences.some((e) => e.startDate);
  if (hasDates) score += 5;
  else missing.push("Tarih bilgisi ekleyin");

  return {
    label: "Deneyim",
    score: Math.min(25, score),
    max: 25,
    missing,
  };
}

function scoreEducation(data: CreateCVFormData): CVSectionScore {
  const missing: string[] = [];
  let score = 0;

  if (data.educations.length === 0) {
    return {
      label: "Eğitim",
      score: 0,
      max: 15,
      missing: ["En az 1 eğitim bilgisi ekleyin"],
    };
  }

  score += 5;

  const hasSchoolAndDegree = data.educations.every((e) => e.school);
  if (hasSchoolAndDegree) score += 5;
  else missing.push("Tüm eğitimlerde okul adı olmalı");

  const hasDegree = data.educations.some((e) => e.degree);
  if (hasDegree) score += 3;
  else missing.push("Derece bilgisi ekleyin");

  const hasDates = data.educations.some((e) => e.startDate || e.endDate);
  if (hasDates) score += 2;
  else missing.push("Eğitim tarihleri ekleyin");

  return {
    label: "Eğitim",
    score: Math.min(15, score),
    max: 15,
    missing,
  };
}

function scoreSkills(data: CreateCVFormData): CVSectionScore {
  const missing: string[] = [];
  let score = 0;

  if (data.skills.technical.length >= 3) score += 7;
  else if (data.skills.technical.length >= 1) score += 4;
  else missing.push("En az 3 teknik beceri ekleyin");

  if (data.skills.soft.length >= 2) score += 4;
  else if (data.skills.soft.length >= 1) score += 2;
  else missing.push("En az 2 soft beceri ekleyin");

  if (data.skills.languages.length >= 1) score += 2;
  else missing.push("En az 1 dil bilgisi ekleyin");

  if (data.skills.certifications.length >= 1) score += 2;

  return {
    label: "Beceriler",
    score: Math.min(20, score),
    max: 20,
    missing,
  };
}

function scoreGeneralQuality(data: CreateCVFormData): CVSectionScore {
  const missing: string[] = [];
  let score = 0;

  // Summary length
  const summaryLen = data.personalInfo.summary?.length || 0;
  if (summaryLen >= 100 && summaryLen <= 500) score += 5;
  else if (summaryLen >= 50) score += 3;
  else if (summaryLen > 0) score += 1;
  else missing.push("Profesyonel özet yazın (100-500 karakter)");

  // Total content richness
  const totalBullets = data.experiences.reduce(
    (sum, e) => sum + e.bullets.filter((b) => b.trim()).length,
    0
  );
  if (totalBullets >= 8) score += 5;
  else if (totalBullets >= 4) score += 3;
  else if (totalBullets >= 1) score += 1;
  else missing.push("Deneyim maddelerini zenginleştirin");

  // No empty required fields
  const hasEmptyRequired =
    !data.personalInfo.fullName ||
    !data.personalInfo.title ||
    !data.personalInfo.email;
  if (!hasEmptyRequired) score += 5;
  else missing.push("Zorunlu alanları doldurun (ad, unvan, e-posta)");

  return {
    label: "Genel Kalite",
    score: Math.min(15, score),
    max: 15,
    missing,
  };
}

export function computeCVScore(formData: CreateCVFormData): CVCompletenessScore {
  const sections = [
    scorePersonalInfo(formData),
    scoreExperience(formData),
    scoreEducation(formData),
    scoreSkills(formData),
    scoreGeneralQuality(formData),
  ];

  const total = sections.reduce((sum, s) => sum + s.score, 0);
  const maxTotal = sections.reduce((sum, s) => sum + s.max, 0);

  const tips: string[] = [];
  for (const section of sections) {
    if (section.missing.length > 0 && section.score < section.max * 0.7) {
      tips.push(...section.missing.slice(0, 2));
    }
  }

  return {
    total: Math.round((total / maxTotal) * 100),
    sections,
    tips: tips.slice(0, 5),
  };
}
