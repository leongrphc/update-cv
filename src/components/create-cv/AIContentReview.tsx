"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

const proposalSchema = z.object({
  success: z.literal(true),
  enhanced: z.string().trim().min(1).max(50_000),
  alternatives: z.array(z.string().max(50_000)).max(5).default([]),
  warnings: z.array(z.string().max(2000)).max(50).default([]),
});
type Review = { original: string; suggestion: string; alternatives: string[]; warnings: string[]; fingerprint: string };

export default function AIContentReview({ content, requestBody, endpoint, responseField = "enhanced", label, onApply, disabled }: {
  content: string; requestBody: object; endpoint: "/api/enhance-cv-content" | "/api/generate-summary";
  responseField?: "enhanced" | "summary"; label: string; onApply: (text: string) => void; disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const controller = useRef<AbortController | null>(null);
  const fingerprint = JSON.stringify({ endpoint, responseField, content, requestBody });
  const latest = useRef(fingerprint);
  latest.current = fingerprint;
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);

  const request = async () => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    const initial = fingerprint;
    setLoading(true); setError(""); setReview(null);
    const timeout = setTimeout(() => active.abort("timeout"), 60_000);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody), signal: active.signal });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(typeof data.error === "string" ? data.error : "AI önerisi alınamadı. Tekrar deneyin.");
      const parsed = proposalSchema.safeParse({ ...data, enhanced: data[responseField] });
      if (!parsed.success) throw new Error("AI geçerli bir öneri döndürmedi. Tekrar deneyin.");
      if (active.signal.aborted) return;
      if (latest.current !== initial) { setError("Metin veya CV bilgileri değişti. Güncel içerik için yeniden öneri isteyin."); return; }
      setReview({ original: content, suggestion: parsed.data.enhanced,
        alternatives: parsed.data.alternatives, warnings: parsed.data.warnings, fingerprint: initial });
    } catch (failure) {
      if (!active.signal.aborted) setError(failure instanceof Error ? failure.message : "Bağlantı kurulamadı. Tekrar deneyin.");
      else if (active.signal.reason === "timeout") setError("AI yanıtı zamanında gelmedi. Tekrar deneyin.");
    } finally {
      clearTimeout(timeout);
      if (controller.current === active) { controller.current = null; setLoading(false); }
    }
  };
  const stale = Boolean(review && review.fingerprint !== fingerprint);
  const cancel = () => { controller.current?.abort(); controller.current = null; setLoading(false); setReview(null); setError(""); };
  return <div className="w-full min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void request()} disabled={disabled || loading}
        className="inline-flex items-center gap-2 py-2 text-sm text-blue-700 dark:text-blue-300 underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{label}
      </button>
      {loading && <><span role="status" className="text-sm text-slate-600 dark:text-slate-300">Öneri hazırlanıyor…</span><button type="button" onClick={cancel} className="text-sm underline underline-offset-4">İptal et</button></>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error} Mevcut metniniz korundu.</p>}
    {review && <section aria-label={`${label} incelemesi`} className="p-4 border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 space-y-4">
      <h3 className="font-semibold">AI önerisini inceleyin</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">Öneri henüz CV’ye uygulanmadı. Yeni bir başarı, sayı veya yetkinlik eklenmediğini kontrol edin; öneriyi burada düzenleyebilirsiniz.</p>
      {review.warnings.length > 0 && <ul className="list-disc pl-5 text-sm text-amber-900 dark:text-amber-200 space-y-1 break-words">{review.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="min-w-0"><h4 className="text-sm font-medium mb-2">Mevcut metin</h4><p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{review.original || "Henüz metin girilmedi."}</p></div>
        <div className="min-w-0"><label className="block text-sm font-medium mb-2">Önerilen metin
          <textarea aria-label="AI öneri metni" value={review.suggestion} maxLength={50_000} rows={6} onChange={event => setReview({ ...review, suggestion: event.target.value })} className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-sm leading-relaxed" /></label></div>
      </div>
      {review.alternatives.length > 0 && <div className="flex flex-wrap gap-3">{review.alternatives.map((text, index) => <button key={index} type="button" onClick={() => setReview({ ...review, suggestion: text })} className="text-sm underline underline-offset-4">Alternatif {index + 1}</button>)}</div>}
      {stale && <p role="alert" className="text-sm text-amber-900 dark:text-amber-200">Metin veya CV bilgileri değişti. Bu öneriyi uygulamak için güncel içerikle yeniden öneri isteyin.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={stale || !review.suggestion.trim()} onClick={() => {
          if (latest.current !== review.fingerprint) { setError("Metin değişti. Yeniden öneri isteyin."); return; }
          onApply(review.suggestion); setReview(null);
        }} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Öneriyi uygula</button>
        <button type="button" onClick={cancel} className="px-4 py-2 text-sm underline underline-offset-4">Öneriyi reddet</button>
      </div>
    </section>}
  </div>;
}
