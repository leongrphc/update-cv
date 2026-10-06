"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export default function PDFCanvasPreview({ url }: { url: string }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageText, setPageText] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const next = Math.floor(entries[0].contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const request = new AbortController();
    let task: PDFDocumentLoadingTask | undefined;
    setDocument(null); setLoading(true); setError(""); setPageText("");
    void (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (request.signal.aborted) return;
      const workerURL = `/pdfjs/pdf.worker-${pdfjs.version}.min.mjs`;
      // Detect a missing worker before PDF.js caches a failed fallback worker.
      const workerResponse = await fetch(workerURL, { signal: request.signal });
      if (!workerResponse.ok) throw new Error("PDF viewer unavailable");
      await workerResponse.arrayBuffer();
      if (request.signal.aborted) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerURL;
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok) throw new Error("PDF unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (request.signal.aborted) return;
      task = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
      const loaded = await task.promise;
      if (request.signal.aborted) return;
      setPage(previous => Math.min(previous, loaded.numPages));
      setDocument(loaded);
    })().catch(() => {
      if (!request.signal.aborted) { setError("PDF önizlemesi açılamadı. Tekrar deneyin veya PDF’yi ayrı sekmede açın / indirin."); setLoading(false); }
    });
    return () => { request.abort(); void task?.destroy().catch(() => undefined); };
  }, [url, retry]);

  useEffect(() => {
    if (!document || !width || !canvas.current) return;
    let active = true;
    let task: RenderTask | undefined;
    const element = canvas.current;
    setLoading(true); setError(""); setPageText("");
    void (async () => {
      const pdfPage = await document.getPage(page);
      if (!active) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: width * zoom / base.width });
      // Bound canvas memory on large screens and high device pixel ratios.
      const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(6_000_000 / (viewport.width * viewport.height)));
      element.width = Math.floor(viewport.width * density);
      element.height = Math.floor(viewport.height * density);
      element.style.width = `${viewport.width}px`;
      element.style.height = `${viewport.height}px`;
      const context = element.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      task = pdfPage.render({ canvas: element, canvasContext: context, viewport,
        transform: [density, 0, 0, density, 0, 0] });
      await task.promise;
      const text = await pdfPage.getTextContent();
      if (!active) return;
      setPageText(text.items.map(item => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join(""));
      setLoading(false);
    })().catch(() => {
      if (active) { setError("Bu sayfa görüntülenemedi. Tekrar deneyin veya PDF’yi indirin; CV bilgileriniz korunuyor."); setLoading(false); }
    });
    return () => { active = false; task?.cancel(); };
  }, [document, width, page, zoom]);

  return <div data-pdf-url={url} className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Önceki PDF sayfası" disabled={!document || page <= 1 || loading} onClick={() => setPage(page - 1)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-sm disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span aria-live="polite">Sayfa {page} / {document?.numPages || "…"}</span>
        <button type="button" aria-label="Sonraki PDF sayfası" disabled={!document || page >= document.numPages || loading} onClick={() => setPage(page + 1)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-sm disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="PDF görünümünü küçült" disabled={zoom <= 0.5 || loading} onClick={() => setZoom(current => Math.max(0.5, current - 0.25))} className="p-2 border border-slate-300 dark:border-slate-600 rounded-sm disabled:opacity-40"><Minus size={16} /></button>
        <button type="button" onClick={() => setZoom(1)} disabled={loading} className="py-2 px-1 underline underline-offset-4">{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="PDF görünümünü büyüt" disabled={zoom >= 2 || loading} onClick={() => setZoom(current => Math.min(2, current + 0.25))} className="p-2 border border-slate-300 dark:border-slate-600 rounded-sm disabled:opacity-40"><Plus size={16} /></button>
      </div>
    </div>
    {loading && <p role="status" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Loader2 size={16} className="animate-spin" /> PDF sayfası görüntüleniyor…</p>}
    {error && <div role="alert" className="text-sm text-red-700 dark:text-red-300"><p>{error}</p><button type="button" onClick={() => setRetry(current => current + 1)} className="mt-2 underline underline-offset-4">Önizlemeyi tekrar aç</button></div>}
    <div className="border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-100 dark:bg-slate-900 p-2">
      <div ref={container} aria-busy={loading} className="max-h-[75vh] min-h-48 overflow-auto">
        <canvas ref={canvas} role="img" aria-label={`CV PDF önizlemesi, sayfa ${page}`} style={{ opacity: loading || error ? 0 : 1 }} className="block bg-white" />
      </div>
    </div>
    {pageText && <details className="text-sm"><summary className="cursor-pointer text-slate-600 dark:text-slate-300">Bu PDF sayfasındaki metni göster</summary>
      <p className="mt-2 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">{pageText}</p></details>}
  </div>;
}
