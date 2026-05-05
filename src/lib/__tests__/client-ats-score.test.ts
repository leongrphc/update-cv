import { describe, it, expect } from "vitest";
import { computeCVScore } from "../client-ats-score";
import type { CreateCVFormData } from "@/types";

const emptyForm: CreateCVFormData = {
  personalInfo: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    websiteUrl: "",
    summary: "",
  },
  experiences: [],
  educations: [],
  skills: { technical: [], soft: [], languages: [], certifications: [] },
  templateId: "modern",
  cvLang: "tr",
};

const fullForm: CreateCVFormData = {
  personalInfo: {
    fullName: "Mustafa Özkan",
    title: "Full Stack Developer",
    email: "mustafa@test.com",
    phone: "+90 555 123 4567",
    location: "İstanbul",
    linkedinUrl: "linkedin.com/in/mustafa",
    websiteUrl: "",
    summary:
      "Deneyimli yazılım geliştirici. 5 yıldır React ve Node.js ile büyük ölçekli uygulamalar geliştiriyorum. Takım çalışmasına yatkın, problem çözme becerileri güçlü.",
  },
  experiences: [
    {
      id: "1",
      position: "Senior Developer",
      company: "ABC Teknoloji",
      location: "İstanbul",
      startDate: "2022-01",
      endDate: "",
      current: true,
      bullets: [
        "React ve Node.js ile büyük ölçekli uygulamalar geliştirdim",
        "5 kişilik takımı yönettim",
        "Performans optimizasyonu ile yükleme süresini %40 azalttım",
      ],
    },
    {
      id: "2",
      position: "Junior Developer",
      company: "XYZ Yazılım",
      location: "Ankara",
      startDate: "2020-01",
      endDate: "2021-12",
      current: false,
      bullets: [
        "REST API'ler oluşturdum",
        "Veritabanı optimizasyonu yaptım",
      ],
    },
  ],
  educations: [
    {
      id: "1",
      school: "İstanbul Teknik Üniversitesi",
      degree: "Lisans",
      field: "Bilgisayar Mühendisliği",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.5",
      description: "",
    },
  ],
  skills: {
    technical: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    soft: ["Takım çalışması", "İletişim"],
    languages: [
      { id: "1", language: "Türkçe", level: "Ana Dil" },
      { id: "2", language: "İngilizce", level: "B2" },
    ],
    certifications: [
      { id: "1", name: "AWS Solutions Architect", issuer: "Amazon", date: "2023" },
    ],
  },
  templateId: "modern",
  cvLang: "tr",
};

describe("computeCVScore", () => {
  it("should return near-zero for empty form", () => {
    const result = computeCVScore(emptyForm);
    expect(result.total).toBeLessThanOrEqual(15);
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it("should return high score for complete form", () => {
    const result = computeCVScore(fullForm);
    expect(result.total).toBeGreaterThanOrEqual(80);
  });

  it("should have 5 sections", () => {
    const result = computeCVScore(fullForm);
    expect(result.sections).toHaveLength(5);
  });

  it("should detect missing personal info", () => {
    const result = computeCVScore(emptyForm);
    const personalSection = result.sections.find(
      (s) => s.label === "Kişisel Bilgiler"
    );
    expect(personalSection?.missing.length).toBeGreaterThan(0);
    expect(personalSection?.missing).toContain("Ad Soyad");
  });

  it("should detect missing experience", () => {
    const result = computeCVScore(emptyForm);
    const expSection = result.sections.find((s) => s.label === "Deneyim");
    expect(expSection?.score).toBe(0);
    expect(expSection?.missing).toContain("En az 1 iş deneyimi ekleyin");
  });

  it("should give partial score for partial form", () => {
    const partial: CreateCVFormData = {
      ...emptyForm,
      personalInfo: {
        ...emptyForm.personalInfo,
        fullName: "Test",
        title: "Developer",
        email: "test@test.com",
      },
    };
    const result = computeCVScore(partial);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(80);
  });

  it("should not exceed 100 total", () => {
    const result = computeCVScore(fullForm);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("should award points for summary length", () => {
    const withSummary = {
      ...emptyForm,
      personalInfo: {
        ...emptyForm.personalInfo,
        fullName: "Test",
        title: "Dev",
        email: "t@t.com",
        summary: "A".repeat(150),
      },
    };
    const result = computeCVScore(withSummary);
    const qualitySection = result.sections.find(
      (s) => s.label === "Genel Kalite"
    );
    expect(qualitySection?.score).toBeGreaterThan(0);
  });
});
