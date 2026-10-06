"use client";

import { useEffect, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, Save, Paintbrush, ExternalLink } from "lucide-react";
import { CreateCVFormData, PDFTemplateId, type CVTemplateTheme, DEFAULT_THEME } from "@/types";
import CVTemplateModern from "./CVTemplateModern";
import CVTemplateClassic from "./CVTemplateClassic";
import CVTemplateCreative from "./CVTemplateCreative";
import CVTemplateExecutive from "./CVTemplateExecutive";
import CVTemplateMinimal from "./CVTemplateMinimal";
import CVTemplateDiamond from "./CVTemplateDiamond";
import TemplateThemeEditor from "./TemplateThemeEditor";
import { reloadPDFFonts } from "./pdf-fonts";

interface PreviewStepProps {
  formData: CreateCVFormData;
  templateId: PDFTemplateId;
  onTemplateChange: (id: PDFTemplateId) => void;
  onSaved: (id: string) => void;
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

// React PDF shares its renderer; serialize jobs while the user changes templates quickly.
let renderQueue: Promise<unknown> = Promise.resolve();
function renderDocument(doc: ReturnType<typeof getTemplateComponent>, reloadFonts: boolean) {
  const job = renderQueue.then(() => {
    if (reloadFonts) reloadPDFFonts();
    return pdf(doc).toBlob();
  });
  renderQueue = job.catch(() => undefined);
  return job;
}

export default function PreviewStep({
  formData,
  templateId,
  onTemplateChange,
  onSaved,
}: PreviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(formData.id);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<CVTemplateTheme>(DEFAULT_THEME);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const previewData = JSON.stringify({ ...formData, id: undefined, title: undefined });
  const doc = useMemo(() => getTemplateComponent(JSON.parse(previewData), theme), [previewData, theme]);

  useEffect(() => {
    let active = true;
    let url: string | undefined;
    setPdfUrl(null);
    setPdfError(null);
    setIsGenerating(true);
    const timer = setTimeout(() => {
      void renderDocument(doc, retry > 0).then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }).catch(() => {
        if (active) setPdfError("PDF oluşturulamadı. Tekrar deneyin veya başka bir şablon seçin; CV bilgileriniz korunuyor.");
      }).finally(() => { if (active) setIsGenerating(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [doc, retry]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      const safeName = formData.personalInfo.fullName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      link.download = `cv-${safeName || "yeni"}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        onSaved(data.id);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTemplateChange(t.id)}
              aria-pressed={templateId === t.id}
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

      <section aria-labelledby="pdf-preview-heading" aria-busy={isGenerating} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 id="pdf-preview-heading" className="font-semibold text-slate-900 dark:text-slate-100">PDF önizlemesi</h3>
          {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 underline underline-offset-4">
            <ExternalLink className="w-4 h-4" /> Önizlemeyi ayrı sekmede aç
          </a>}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">Önizlemede gördüğünüz dosya indirilir. Şablon değişiklikleri PDF’ye uygulanır.</p>
        {isGenerating && <div role="status" className="min-h-40 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-sm text-slate-700 dark:text-slate-200"><Loader2 className="w-5 h-5 animate-spin" /> PDF hazırlanıyor…</div>}
        {pdfError && <div role="alert" className="bg-red-50 dark:bg-red-950/40 p-4 rounded-sm text-sm text-red-800 dark:text-red-200">
          <p>{pdfError}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 font-medium underline underline-offset-4">PDF’yi tekrar oluştur</button>
        </div>}
        {pdfUrl && <iframe title="CV PDF önizlemesi" src={pdfUrl} className="w-full h-[70vh] min-h-[400px] border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-100" />}
        {pdfUrl && <p className="text-xs text-slate-600 dark:text-slate-300">Tarayıcınız önizlemeyi göstermiyorsa ayrı sekmede açın veya PDF’yi indirin.</p>}
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating || !pdfUrl}
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
