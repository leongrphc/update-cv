"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cvFormSchema, emptyCV } from "@/lib/cv-form";
import { draftKey, editorSnapshotSchema, listDrafts, readDraft, type EditorSnapshot } from "@/lib/cv-draft";

type Context = { ownerId: string; document: string; revision: string | null };

export function useEditorDraft(snapshot: EditorSnapshot, restore: (snapshot: EditorSnapshot) => void) {
  const router = useRouter();
  const params = useSearchParams();
  const serverId = params.get("id");
  const localId = params.get("draft");
  const legacyEdit = params.get("edit") === "true";
  const download = params.get("download") === "true";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [context, setContext] = useState<Context | null>(null);
  const [drafts, setDrafts] = useState<ReturnType<typeof listDrafts>>([]);
  const contextRef = useRef<Context | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const editingSession = useRef(crypto.randomUUID());
  const conflict = useRef(false);
  const writeRef = useRef<(() => void) | null>(null);

  const persist = useCallback((ctx: Context, state: EditorSnapshot) => {
    if (conflict.current) return;
    try {
      const current = readDraft(localStorage, ctx.ownerId, ctx.document);
      if (current && current.revision !== ctx.revision && current.editingSession !== editingSession.current) {
        conflict.current = true;
        setStatus("Bu taslak başka sekmede değişti. Düzenlemelerinizi korumak için yeni taslak olarak açın.");
        return;
      }
      const revision = crypto.randomUUID();
      localStorage.setItem(draftKey(ctx.ownerId, ctx.document), JSON.stringify({ version: 1,
        ownerId: ctx.ownerId, document: ctx.document, revision, editingSession: editingSession.current,
        updatedAt: new Date().toISOString(), snapshot: editorSnapshotSchema.parse(state) }));
      ctx.revision = revision;
      setDrafts(listDrafts(localStorage, ctx.ownerId));
      setStatus("Taslak bu tarayıcıda kaydedildi.");
      return true;
    } catch {
      setStatus("Yerel taslak kaydedilemedi. CV’nizi hesabınıza kaydedin veya taslak yedeğini indirin.");
    }
  }, []);

  useEffect(() => {
    const request = new AbortController();
    setReady(false); setError(null); conflict.current = false;
    void (async () => {
      const auth = await (await fetch("/api/auth/me", { signal: request.signal })).json();
      if (!auth.user?.id) throw new Error("Oturumunuz sona erdi. Tekrar giriş yapın.");
      const ownerId = auth.user.id as string;
      if (!serverId && !localId) {
        let incomingId: string | undefined;
        if (legacyEdit || download) {
          const legacyKey = legacyEdit ? "editCreatedCV" : "downloadCreatedCV";
          try { incomingId = JSON.parse(sessionStorage.getItem(legacyKey) || "null")?.id; } catch { /* Invalid legacy payload. */ }
          sessionStorage.removeItem(legacyKey);
        }
        if (incomingId) { router.replace(`/create-cv?id=${encodeURIComponent(incomingId)}${download ? "&download=true" : ""}`); return; }
        let active: string | null = null;
        try { active = sessionStorage.getItem(`cv-active:${ownerId}`); } catch { /* Storage unavailable. */ }
        router.replace(`/create-cv?draft=${encodeURIComponent(active || crypto.randomUUID())}`);
        return;
      }
      const document = serverId ? `saved:${serverId}` : `local:${localId}`;
      let state: EditorSnapshot = { form: emptyCV(), step: 0, beforeImport: null, pdfReview: null };
      if (serverId) {
        const response = await fetch(`/api/my-cvs/${encodeURIComponent(serverId)}`, { signal: request.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "CV açılamadı.");
        state.form = cvFormSchema.parse(result.cv);
        if (download) state.step = 4;
      }
      let revision: string | null = null;
      let recovered = false;
      try {
        const draft = readDraft(localStorage, ownerId, document);
        if (draft && (!serverId || draft.snapshot.form.id === serverId)) {
          revision = draft.revision;
          if (!download) { state = draft.snapshot; recovered = true; }
        }
      } catch { setStatus("Önceki taslak okunamadı. Kaydedilmiş CV bilgileriyle devam edebilirsiniz."); }
      if (request.signal.aborted) return;
      const nextContext = { ownerId, document, revision };
      contextRef.current = nextContext;
      setContext(nextContext);
      try { setDrafts(listDrafts(localStorage, ownerId)); } catch { /* Storage unavailable. */ }
      restore(state);
      setReady(true);
      if (recovered) setStatus("Taslak geri yüklendi. Kaldığınız yerden devam edebilirsiniz.");
      if (!serverId) try { sessionStorage.setItem(`cv-active:${ownerId}`, localId!); } catch { /* Storage unavailable. */ }
    })().catch((failure) => { if (!request.signal.aborted) { setError(failure instanceof Error ? failure.message : "CV açılamadı."); setReady(true); } });
    return () => request.abort();
  }, [serverId, localId, legacyEdit, download, router, restore]);

  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (!ready || error || !context) { writeRef.current = null; return; }
    const state = JSON.parse(serialized) as EditorSnapshot;
    const write = () => persist(context, state);
    writeRef.current = write;
    const timer = setTimeout(write, 450);
    return () => clearTimeout(timer);
  }, [ready, error, context, serialized, persist]);

  useEffect(() => {
    const flush = () => writeRef.current?.();
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => { flush(); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
  }, []);

  const startNew = useCallback((state?: EditorSnapshot) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    writeRef.current?.();
    const id = crypto.randomUUID();
    const next = { ownerId: ctx.ownerId, document: `local:${id}`, revision: null };
    conflict.current = false;
    const nextState = state || { form: emptyCV(), step: 0, beforeImport: null, pdfReview: null };
    if (!persist(next, nextState)) { restore(nextState); return; }
    setReady(false); writeRef.current = null;
    router.replace(`/create-cv?draft=${id}`);
  }, [persist, restore, router]);

  const onSaved = useCallback((id: string) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    const state = { ...snapshotRef.current, form: { ...snapshotRef.current.form, id } };
    if (serverId === id) { restore(state); persist(ctx, state); return; }
    const document = `saved:${id}`;
    let revision: string | null = null;
    try { revision = readDraft(localStorage, ctx.ownerId, document)?.revision || null; } catch { /* No reusable draft. */ }
    persist({ ownerId: ctx.ownerId, document, revision }, state);
    setReady(false); writeRef.current = null;
    router.replace(`/create-cv?id=${encodeURIComponent(id)}`);
  }, [persist, restore, router, serverId]);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ version: 1, snapshot: snapshotRef.current }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "cv-taslak-yedegi.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const openDraft = (document: string) => {
    writeRef.current?.();
    const [kind, ...parts] = document.split(":");
    const id = encodeURIComponent(parts.join(":"));
    router.replace(kind === "saved" ? `/create-cv?id=${id}` : `/create-cv?draft=${id}`);
  };
  const importBackup = async (file: File) => {
    try {
      if (!file.name.toLowerCase().endsWith(".json") || file.size > 2 * 1024 * 1024) throw new Error();
      const data = JSON.parse(await file.text());
      if (data.version !== 1) throw new Error();
      const state = editorSnapshotSchema.parse(data.snapshot);
      startNew({ ...state, form: { ...state.form, id: undefined }, beforeImport: null });
    } catch { setStatus("Taslak yedeği açılamadı. Geçerli, en fazla 2 MB JSON taslak yedeğini seçin. Mevcut alanlarınız korundu."); }
  };
  return { ready, error, status, drafts, startNew, onSaved, downloadBackup, openDraft, importBackup };
}
