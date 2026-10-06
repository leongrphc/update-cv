import { describe, expect, it } from "vitest";
import { draftKey, listDrafts, readDraft } from "@/lib/cv-draft";
import { emptyCV } from "@/lib/cv-form";

const stored = (ownerId: string, document: string) => ({ version: 1, ownerId, document,
  revision: "revision", editingSession: "tab", updatedAt: "2026-10-06T12:00:00Z",
  snapshot: { form: emptyCV(), step: 1, beforeImport: null, pdfReview: null } });

describe("draft recovery", () => {
  it("keeps incomplete work and progress without enforcing final CV requirements", () => {
    const draft = stored("owner", "local:document");
    draft.snapshot.form.personalInfo.email = "unfinished@";
    localStorage.setItem(draftKey("owner", "local:document"), JSON.stringify(draft));
    expect(readDraft(localStorage, "owner", "local:document")?.snapshot.form.personalInfo.email).toBe("unfinished@");
    expect(readDraft(localStorage, "owner", "local:document")?.snapshot.step).toBe(1);
  });
  it("isolates recovery and draft listings by account and document", () => {
    localStorage.clear();
    for (const [owner, document] of [["alice", "local:first"], ["bob", "local:first"], ["alice", "saved:second"]]) {
      localStorage.setItem(draftKey(owner, document), JSON.stringify(stored(owner, document)));
    }
    expect(listDrafts(localStorage, "alice").map((draft) => draft.document).sort()).toEqual(["local:first", "saved:second"]);
    expect(readDraft(localStorage, "bob", "saved:second")).toBeNull();
  });
  it("rejects a mismatched owner rather than restoring their data", () => {
    localStorage.setItem(draftKey("alice", "local:first"), JSON.stringify(stored("bob", "local:first")));
    expect(() => readDraft(localStorage, "alice", "local:first")).toThrow("mismatch");
  });
  it("ignores corrupted drafts in the picker while leaving the source intact", () => {
    localStorage.clear();
    const key = draftKey("alice", "bad");
    localStorage.setItem(key, "broken-json");
    expect(listDrafts(localStorage, "alice")).toEqual([]);
    expect(localStorage.getItem(key)).toBe("broken-json");
  });
});
