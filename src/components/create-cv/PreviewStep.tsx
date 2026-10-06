"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, Save, Paintbrush } from "lucide-react";
import { CreateCVFormData, PDFTemplateId, type CVTemplateTheme, DEFAULT_THEME } from "@/types";
import CVTemplateModern from "./CVTemplateModern";
import CVTemplateClassic from "./CVTemplateClassic";
import CVTemplateCreative from "./CVTemplateCreative";
import CVTemplateExecutive from "./CVTemplateExecutive";
import CVTemplateMinimal from "./CVTemplateMinimal";
import CVTemplateDiamond from "./CVTemplateDiamond";
import TemplateThemeEditor from "./TemplateThemeEditor";

interface PreviewStepProps {
  formData: CreateCVFormData;
  templateId: PDFTemplateId;
  onTemplateChange: (id: PDFTemplateId) => void;
}

const templates: { id: PDFTemplateId; name: string; description: string }[] = [
  {
    id: "modern",
    name: "Modern",
    description: "İki sütunlu, profesyonel tasarım",
  },
  {
    id: "classic",
    name: "Klasik",
    description: "Tek sütunlu, geleneksel format",
  },
  {
    id: "creative",
    name: "Yaratıcı",
    description: "Renkli sidebar ile dikkat çekici",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Üst düzey yönetici, altın aksanlı",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-temiz, İskandinav tasarım",
  },
  {
    id: "diamond",
    name: "Diamond",
    description: "Zümrüt yeşil sidebar, premium",
  },
];

function getTemplateComponent(data: CreateCVFormData, theme?: CVTemplateTheme) {
  switch (data.templateId) {
    case "classic":
      return <CVTemplateClassic data={data} />;
    case "creative":
      return <CVTemplateCreative data={data} />;
    case "executive":
      return <CVTemplateExecutive data={data} />;
    case "minimal":
      return <CVTemplateMinimal data={data} />;
    case "diamond":
      return <CVTemplateDiamond data={data} />;
    default:
      return <CVTemplateModern data={data} theme={theme} />;
  }
}

export default function PreviewStep({
  formData,
  templateId,
  onTemplateChange,
}: PreviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(formData.id);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<CVTemplateTheme>(DEFAULT_THEME);
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = getTemplateComponent(formData, theme);
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = formData.personalInfo.fullName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      link.download = `cv-${safeName || "yeni"}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/save-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: savedId || formData.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedId(data.id);
        setSaveMessage("CV başarıyla kaydedildi!");
      } else {
        setSaveMessage(data.error || "Kaydetme başarısız. Giriş yapmayı deneyin.");
      }
    } catch {
      setSaveMessage("Kaydetme sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Şablon Seçimi
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTemplateChange(t.id)}
              className={`p-4 border-2 rounded-sm text-left transition-all ${
                templateId === t.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <p
                className={`font-medium text-sm ${
                  templateId === t.id
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {t.name} {templateId === t.id && "✓"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Editor */}
      {templateId === "modern" && (
        <div>
          <button
            type="button"
            onClick={() => setShowThemeEditor(!showThemeEditor)}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-3"
          >
            <Paintbrush className="w-4 h-4" />
            Tema Özelleştir
            <span className="text-xs">{showThemeEditor ? "▲" : "▼"}</span>
          </button>
          {showThemeEditor && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <TemplateThemeEditor theme={theme} onChange={setTheme} />
            </div>
          )}
        </div>
      )}

      {/* CV Summary Preview */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          CV Özeti
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Ad:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.personalInfo.fullName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Ünvan:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.personalInfo.title}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Deneyim:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.experiences.length} pozisyon
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Eğitim:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.educations.length} kayıt
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Teknik Beceriler:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.skills.technical.length}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Diller:</span>{" "}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formData.skills.languages.length}
            </span>
          </div>
        </div>

        {/* Skills Preview */}
        {formData.skills.technical.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
              Teknik Beceriler:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.skills.technical.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              PDF Oluşturuluyor...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              PDF Olarak İndir
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white font-medium rounded-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Kaydet
        </button>
      </div>

      {saveMessage && (
        <div
          className={`px-4 py-3 rounded-sm text-sm ${
            saveMessage.includes("başarı")
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          {saveMessage}
        </div>
      )}
    </div>
  );
}
