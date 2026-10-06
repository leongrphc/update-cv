"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Linkedin, Upload, Keyboard, Globe } from "lucide-react";
import StepIndicator from "@/components/create-cv/StepIndicator";
import PersonalInfoStep from "@/components/create-cv/PersonalInfoStep";
import ExperienceStep from "@/components/create-cv/ExperienceStep";
import EducationStep from "@/components/create-cv/EducationStep";
import SkillsStep from "@/components/create-cv/SkillsStep";
import PreviewStep from "@/components/create-cv/PreviewStep";
import PDFCVImport from "@/components/create-cv/PDFCVImport";
import LinkedInUpload from "@/components/LinkedInUpload";
import LinkedInManualForm from "@/components/LinkedInManualForm";
import { CVScoreWidget } from "@/components/create-cv/CVScoreWidget";
import {
  CreateCVFormData,
  CVPersonalInfo,
  CVExperienceEntry,
  CVEducationEntry,
  CVSkillsData,
  LinkedInProfile,
  CVTemplateTheme,
} from "@/types";

const initialPersonalInfo: CVPersonalInfo = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  websiteUrl: "",
  summary: "",
};

const initialSkills: CVSkillsData = {
  technical: [],
  soft: [],
  languages: [],
  certifications: [],
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function mapLinkedInToForm(profile: LinkedInProfile) {
  const personalInfo: CVPersonalInfo = {
    fullName: profile.fullName,
    title: profile.headline || "",
    email: "",
    phone: "",
    location: profile.location || "",
    linkedinUrl: "",
    websiteUrl: "",
    summary: profile.summary || "",
  };

  const experiences: CVExperienceEntry[] = profile.experience.map((exp) => ({
    id: generateId(),
    position: exp.title,
    company: exp.company,
    location: exp.location || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    current: exp.current,
    bullets: exp.description
      ? exp.description.split("\n").filter(Boolean)
      : [""],
  }));

  const educations: CVEducationEntry[] = profile.education.map((edu) => ({
    id: generateId(),
    school: edu.school,
    degree: edu.degree || "",
    field: edu.field || "",
    startDate: edu.startDate || "",
    endDate: edu.endDate || "",
    gpa: "",
    description: edu.description || "",
  }));

  const skills: CVSkillsData = {
    technical: profile.skills || [],
    soft: [],
    languages: (profile.languages || []).map((lang) => ({
      id: generateId(),
      language: lang.language,
      level: mapProficiency(lang.proficiency),
    })),
    certifications: (profile.certifications || []).map((cert) => ({
      id: generateId(),
      name: cert.name,
      issuer: cert.issuer,
      date: cert.issueDate || "",
    })),
  };

  return { personalInfo, experiences, educations, skills };
}

function mapProficiency(
  p: "elementary" | "limited" | "professional" | "full" | "native"
): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Ana Dil" {
  switch (p) {
    case "elementary":
      return "A1";
    case "limited":
      return "A2";
    case "professional":
      return "B2";
    case "full":
      return "C1";
    case "native":
      return "Ana Dil";
    default:
      return "B1";
  }
}

export default function CreateCVPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto py-20 text-center text-slate-400">Yükleniyor...</div>}>
      <CreateCVContent />
    </Suspense>
  );
}

function CreateCVContent() {
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const isDownload = searchParams.get("download") === "true";

  const [currentStep, setCurrentStep] = useState(0);
  const [cvId, setCvId] = useState<string>();
  const [cvTitle, setCvTitle] = useState<string>();
  const [personalInfo, setPersonalInfo] =
    useState<CVPersonalInfo>(initialPersonalInfo);
  const [experiences, setExperiences] = useState<CVExperienceEntry[]>([]);
  const [educations, setEducations] = useState<CVEducationEntry[]>([]);
  const [skills, setSkills] = useState<CVSkillsData>(initialSkills);
  const [templateId, setTemplateId] = useState<
    "modern" | "classic" | "creative" | "executive" | "minimal" | "diamond"
  >("modern");
  const [cvLang, setCvLang] = useState<"tr" | "en">("tr");
  const [theme, setTheme] = useState<CVTemplateTheme>();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [beforeImport, setBeforeImport] = useState<CreateCVFormData | null>(null);

  // LinkedIn import state
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInMode, setLinkedInMode] = useState<"pdf" | "manual">("pdf");
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [linkedInImported, setLinkedInImported] = useState(false);

  // Load edit/download data from sessionStorage
  useEffect(() => {
    if (isEdit) {
      const stored = sessionStorage.getItem("editCreatedCV");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCvId(data.id);
          setCvTitle(data.title);
          setPersonalInfo(data.personalInfo);
          setExperiences(data.experiences || []);
          setEducations(data.educations || []);
          setSkills(data.skills || initialSkills);
          setTemplateId(data.templateId || "modern");
          setCvLang(data.cvLang || "tr");
          setTheme(data.theme);
          sessionStorage.removeItem("editCreatedCV");
        } catch {
          // ignore
        }
      }
    } else if (isDownload) {
      const stored = sessionStorage.getItem("downloadCreatedCV");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCvId(data.id);
          setCvTitle(data.title);
          setPersonalInfo(data.personalInfo);
          setExperiences(data.experiences || []);
          setEducations(data.educations || []);
          setSkills(data.skills || initialSkills);
          setTemplateId(data.templateId || "modern");
          setCvLang(data.cvLang || "tr");
          setTheme(data.theme);
          setCurrentStep(4); // Jump to preview/download step
          sessionStorage.removeItem("downloadCreatedCV");
        } catch {
          // ignore
        }
      }
    }
  }, [isEdit, isDownload]);

  const formData: CreateCVFormData = {
    id: cvId,
    title: cvTitle,
    personalInfo,
    experiences,
    educations,
    skills,
    templateId,
    cvLang,
    theme,
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          personalInfo.fullName.trim() &&
          (!personalInfo.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email))
        );
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo,
          experiences,
          skills,
        }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setPersonalInfo((prev) => ({ ...prev, summary: data.summary }));
      }
    } catch {
      // Summary generation failed
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleLinkedInParsed = (profile: LinkedInProfile) => {
    const mapped = mapLinkedInToForm(profile);
    setPersonalInfo(mapped.personalInfo);
    setExperiences(mapped.experiences);
    setEducations(mapped.educations);
    setSkills(mapped.skills);
    setShowLinkedInImport(false);
    setLinkedInImported(true);
    setLinkedInError(null);
  };

  const handleLinkedInManualSubmit = (profile: LinkedInProfile) => {
    handleLinkedInParsed(profile);
  };

  const applyForm = (cv: CreateCVFormData) => {
    setCvId(cv.id);
    setCvTitle(cv.title);
    setPersonalInfo(cv.personalInfo);
    setExperiences(cv.experiences);
    setEducations(cv.educations);
    setSkills(cv.skills);
    setTemplateId(cv.templateId);
    setCvLang(cv.cvLang || "tr");
    setTheme(cv.theme);
  };

  return (
    <div className="max-w-6xl mx-auto flex gap-6">
      <div className="flex-1 min-w-0">
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {isEdit ? "CV Düzenle" : "CV Oluştur"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isEdit
              ? "Mevcut CV'nizi düzenleyin ve güncelleyin."
              : "PDF CV’nizi düzenleyin veya sıfırdan yeni bir CV oluşturun."}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2">
          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <button
            type="button"
            onClick={() => setCvLang("tr")}
            className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
              cvLang === "tr"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            TR
          </button>
          <button
            type="button"
            onClick={() => setCvLang("en")}
            className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
              cvLang === "en"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div hidden={currentStep !== 0}><PDFCVImport
        hasContent={Boolean(personalInfo.fullName || experiences.length || educations.length || skills.technical.length)}
        canUndo={Boolean(beforeImport)}
        onApply={(cv) => { setBeforeImport(formData); applyForm({ ...cv, id: undefined, title: undefined }); setShowLinkedInImport(false); }}
        onUndo={() => { if (beforeImport) applyForm(beforeImport); setBeforeImport(null); }}
      /></div>

      {/* LinkedIn Import Banner */}
      {!showLinkedInImport && !linkedInImported && currentStep === 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-5">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-sm flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  LinkedIn&apos;den Bilgileri Çek
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  LinkedIn profilinizden bilgileri otomatik olarak doldurun.
                  Deneyim, eğitim, beceriler ve daha fazlası.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLinkedInImport(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              LinkedIn&apos;den Çek
            </button>
          </div>
        </div>
      )}

      {/* LinkedIn Imported Success */}
      {linkedInImported && currentStep === 0 && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-sm flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  LinkedIn bilgileri başarıyla aktarıldı!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Alanları kontrol edip gerekirse düzenleyebilirsiniz. E-posta
                  ve telefon alanlarını manuel doldurun.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLinkedInImported(false);
                setShowLinkedInImport(true);
              }}
              className="text-sm text-green-700 dark:text-green-400 hover:underline whitespace-nowrap"
            >
              Tekrar Çek
            </button>
          </div>
        </div>
      )}

      {/* LinkedIn Import Modal/Section */}
      {showLinkedInImport && (
        <div className="mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              LinkedIn&apos;den Bilgileri İçe Aktar
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowLinkedInImport(false);
                setLinkedInError(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLinkedInMode("pdf")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm font-medium transition-colors ${
                linkedInMode === "pdf"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              <Upload className="w-4 h-4" />
              PDF Yükle
            </button>
            <button
              type="button"
              onClick={() => setLinkedInMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm font-medium transition-colors ${
                linkedInMode === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Manuel Giriş
            </button>
          </div>

          {linkedInError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm mb-4 text-sm">
              {linkedInError}
            </div>
          )}

          {linkedInMode === "pdf" ? (
            <LinkedInUpload
              onProfileParsed={handleLinkedInParsed}
              onError={setLinkedInError}
            />
          ) : (
            <LinkedInManualForm
              onSubmit={handleLinkedInManualSubmit}
              onCancel={() => {
                setShowLinkedInImport(false);
                setLinkedInError(null);
              }}
            />
          )}
        </div>
      )}

      <StepIndicator currentStep={currentStep} />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 mb-6">
        {/* Step Title */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
          {currentStep === 0 && "Kişisel Bilgiler"}
          {currentStep === 1 && "İş Deneyimi"}
          {currentStep === 2 && "Eğitim Bilgileri"}
          {currentStep === 3 && "Beceriler, Diller & Sertifikalar"}
          {currentStep === 4 && "Önizleme & İndirme"}
        </h2>

        {/* Step Content */}
        {currentStep === 0 && (
          <PersonalInfoStep
            data={personalInfo}
            onChange={setPersonalInfo}
            onGenerateSummary={handleGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
          />
        )}
        {currentStep === 1 && (
          <ExperienceStep data={experiences} onChange={setExperiences} />
        )}
        {currentStep === 2 && (
          <EducationStep data={educations} onChange={setEducations} />
        )}
        {currentStep === 3 && (
          <SkillsStep data={skills} onChange={setSkills} />
        )}
        {currentStep === 4 && (
          <PreviewStep
            formData={formData}
            templateId={templateId}
            onTemplateChange={setTemplateId}
            onSaved={setCvId}
            onThemeChange={setTheme}
          />
        )}
      </div>

      {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          {currentStep < 4 && <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>}
        </div>
      </div>

      {/* Score Widget Sidebar (hidden on preview step and mobile) */}
      {currentStep < 4 && (
        <div className="hidden lg:block w-64 flex-shrink-0">
          <CVScoreWidget formData={formData} />
        </div>
      )}
    </div>
  );
}
