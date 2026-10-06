"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Upload, Undo2 } from "lucide-react";
import type { CreateCVFormData } from "@/types";

interface ImportResult {
  cv: CreateCVFormData;
  warnings: string[];
  sourceText: string;
  unmappedSections: { heading: string; content: string }[];
}

interface Props {
  hasContent: boolean;
  onApply: (cv: CreateCVFormData) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function PDFCVImport({ hasContent, onApply, onUndo, canUndo }: Props) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Yalnızca PDF dosyası seçin."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("PDF dosyası en fazla 5 MB olabilir."); return;
    }
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setResult(null);
    setApplied(false);
    setFileName(file.name);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/import-cv", { method: "POST", body, signal: request.signal });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "CV aktarılamadı. Tekrar deneyin.");
      if (!request.signal.aborted) setResult(data);
    } catch (failure) {
      if (!request.signal.aborted) setError(failure instanceof Error ? failure.message : "Bağlantı kurulamadı. Tekrar deneyin.");
    } finally {
      if (controller.current === request) { setLoading(false); controller.current = null; }
    }
  };

  return (
    <section aria-labelledby="pdf-import-heading" className="mb-6 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div className="min-w-0">
          <h2 id="pdf-import-heading" className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" /> Mevcut PDF CV’yi düzenle
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-prose">
            PDF’deki bilgileri kontrol ederek düzenlenebilir alanlara aktarın, ardından yeni bir şablonla indirin.
          </p>
          <p id="pdf-import-help" className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            En fazla 5 MB · Seçilebilir metin içeren PDF · Metin AI sağlayıcısına gönderilir.
            Orijinal tasarım yeniden oluşturulmaz; yeni şablon uygulanır.
          </p>
        </div>
        <input ref={fileInput} id="cv-pdf-file" type="file" accept="application/pdf,.pdf" className="sr-only"
          tabIndex={-1} aria-label="CV PDF dosyası" aria-describedby="pdf-import-help"
          disabled={loading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        <button type="button" disabled={loading} onClick={() => fileInput.current?.click()}
          className="flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
          <Upload className="w-4 h-4" /> {result || error ? "Başka PDF seç" : "PDF CV yükle"}
        </button>
      </div>

      {loading && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
        <p role="status" className="flex items-center gap-2 min-w-0"><Loader2 className="w-4 h-4 shrink-0 animate-spin" /> CV alanları çıkarılıyor…</p>
        <button type="button" onClick={() => { controller.current?.abort(); setLoading(false); }} className="underline underline-offset-4">İptal et</button>
      </div>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error} Mevcut alanlarınız değiştirilmedi.</p>}

      {result && <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{applied ? "PDF bilgileri forma aktarıldı" : "Aktarmadan önce kontrol edin"}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 break-all mt-1">{fileName}</p>
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-slate-600 dark:text-slate-300">Ad soyad</dt><dd className="font-medium break-words">{result.cv.personalInfo.fullName || "Bulunamadı"}</dd></div>
          <div><dt className="text-slate-600 dark:text-slate-300">Ünvan</dt><dd className="font-medium break-words">{result.cv.personalInfo.title || "Bulunamadı"}</dd></div>
          <div><dt className="text-slate-600 dark:text-slate-300">Bölümler</dt><dd>{result.cv.experiences.length} deneyim, {result.cv.educations.length} eğitim, {result.cv.skills.technical.length + result.cv.skills.soft.length} beceri</dd></div>
          <div><dt className="text-slate-600 dark:text-slate-300">PDF başlık dili</dt><dd>{result.cv.cvLang === "en" ? "İngilizce" : "Türkçe"}</dd></div>
        </dl>
        <p className="text-sm text-slate-700 dark:text-slate-200">Otomatik çıkarılan bilgiler hata içerebilir. Tarihleri, iletişim bilgilerini ve tüm bölümleri kaynak metinle karşılaştırın.</p>
        {result.warnings.length > 0 && <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-sm text-sm text-amber-900 dark:text-amber-200">
          <p className="font-medium mb-2">Kontrol edilmesi gerekenler</p>
          <ul className="list-disc pl-5 space-y-1">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </div>}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Kaynak metin ve aktarılamayan bölümler</summary>
          {result.unmappedSections.map((section, index) => <div key={index} className="mt-3">
            <p className="font-semibold">{section.heading} — yeni PDF’ye eklenmez</p>
            <p className="whitespace-pre-wrap break-words mt-1">{section.content}</p>
          </div>)}
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words font-sans leading-relaxed bg-slate-50 dark:bg-slate-900 p-3">{result.sourceText}</pre>
        </details>
        {!applied && <>
          {hasContent && <p className="text-sm text-slate-700 dark:text-slate-200">Aktarım mevcut form alanlarını değiştirecek. Önceki alanları geri alabilirsiniz; kayıt yeni bir CV oluşturur.</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => { onApply(result.cv); setApplied(true); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Kontrol ettim, alanlara aktar</button>
            <button type="button" onClick={() => setResult(null)} className="px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm">Vazgeç</button>
          </div>
        </>}
        {applied && canUndo && <button type="button" onClick={() => { onUndo(); setApplied(false); }} className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 underline underline-offset-4"><Undo2 className="w-4 h-4" /> İçe aktarmayı geri al</button>}
      </div>}
    </section>
  );
}
