import { z } from "zod";
import { cvFormSchema } from "./cv-form";
import type { CreateCVFormData } from "@/types";

export const pdfReviewSchema = z.object({
  fileName: z.string(), applied: z.boolean(),
  result: z.object({ cv: cvFormSchema, warnings: z.array(z.string()), sourceText: z.string().max(50_000),
    unmappedSections: z.array(z.object({ heading: z.string(), content: z.string() })) }),
});
export type PDFImportReview = z.infer<typeof pdfReviewSchema>;
export const editorSnapshotSchema = z.object({
  form: cvFormSchema, step: z.number().int().min(0).max(4),
  beforeImport: cvFormSchema.nullable().default(null), pdfReview: pdfReviewSchema.nullable().default(null),
});
export type EditorSnapshot = Omit<z.infer<typeof editorSnapshotSchema>, "form" | "beforeImport"> & {
  form: CreateCVFormData; beforeImport: CreateCVFormData | null;
};
export const draftSchema = z.object({ version: z.literal(1), ownerId: z.string(), document: z.string(),
  revision: z.string(), editingSession: z.string(), updatedAt: z.string(), snapshot: editorSnapshotSchema });

export function draftKey(ownerId: string, document: string) {
  return `cv-editor:v1:${encodeURIComponent(ownerId)}:${encodeURIComponent(document)}`;
}
export function readDraft(storage: Pick<Storage, "getItem">, ownerId: string, document: string) {
  const raw = storage.getItem(draftKey(ownerId, document));
  if (!raw) return null;
  const draft = draftSchema.parse(JSON.parse(raw));
  if (draft.ownerId !== ownerId || draft.document !== document) throw new Error("Draft owner or document mismatch");
  return draft;
}

export function listDrafts(storage: Pick<Storage, "length" | "key" | "getItem">, ownerId: string) {
  const prefix = `cv-editor:v1:${encodeURIComponent(ownerId)}:`;
  const drafts: { document: string; label: string; updatedAt: string }[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      const draft = draftSchema.parse(JSON.parse(storage.getItem(key)!));
      if (draft.ownerId !== ownerId) continue;
      drafts.push({ document: draft.document,
        label: draft.snapshot.form.personalInfo.fullName || draft.snapshot.form.title || "İsimsiz CV", updatedAt: draft.updatedAt });
    } catch { /* Ignore damaged drafts in the picker, preserve their stored data. */ }
  }
  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 100);
}
