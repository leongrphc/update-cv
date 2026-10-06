import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AIContentReview from "./AIContentReview";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const props = { content: "12 projeyi tamamladım.", requestBody: { content: "12 projeyi tamamladım.", cvLang: "en", targetRole: "Developer" },
  endpoint: "/api/enhance-cv-content" as const, label: "AI ile metin öner", onApply: vi.fn() };
const result = { success: true, enhanced: "Delivered 12 projects.", alternatives: ["Completed 12 projects."], warnings: ["Kaynak bilgilerle karşılaştırın."] };
const response = (body: unknown = result, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const start = () => fireEvent.click(screen.getByRole("button", { name: "AI ile metin öner" }));

describe("reviewing AI changes", () => {
  it("keeps the original untouched until the user edits and approves the proposal", async () => {
    const onApply = vi.fn(); const fetch = vi.fn().mockResolvedValue(response()); vi.stubGlobal("fetch", fetch);
    render(<AIContentReview {...props} onApply={onApply} />); start();
    await screen.findByRole("heading", { name: "AI önerisini inceleyin" });
    expect(screen.getByText(props.content)).toBeVisible(); expect(onApply).not.toHaveBeenCalled();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(props.requestBody);
    expect(screen.getByText(result.warnings[0])).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Alternatif 1" }));
    expect(screen.getByLabelText("AI öneri metni")).toHaveValue(result.alternatives[0]);
    fireEvent.change(screen.getByLabelText("AI öneri metni"), { target: { value: "My reviewed text" } });
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi uygula" }));
    expect(onApply).toHaveBeenCalledExactlyOnceWith("My reviewed text");
    expect(screen.queryByRole("heading", { name: "AI önerisini inceleyin" })).toBeNull();
  });
  it("rejects a proposal without modifying content", async () => {
    const onApply = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
    render(<AIContentReview {...props} onApply={onApply} />); start();
    await screen.findByRole("button", { name: "Öneriyi reddet" });
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi reddet" }));
    expect(onApply).not.toHaveBeenCalled();
  });
  it("discards a late answer when the user has typed newer content", async () => {
    let resolve!: (response: Response) => void; const onApply = vi.fn();
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    const view = render(<AIContentReview {...props} onApply={onApply} />); start();
    view.rerender(<AIContentReview {...props} content="Updated by the user" onApply={onApply} />);
    resolve(response());
    expect(await screen.findByRole("alert")).toHaveTextContent("Metin veya CV bilgileri değişti");
    expect(screen.queryByRole("button", { name: "Öneriyi uygula" })).toBeNull(); expect(onApply).not.toHaveBeenCalled();
  });
  it("disables approval after the target role or profile changes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
    const view = render(<AIContentReview {...props} />); start();
    await screen.findByRole("button", { name: "Öneriyi uygula" });
    view.rerender(<AIContentReview {...props} requestBody={{ ...props.requestBody, targetRole: "Designer" }} />);
    expect(screen.getByRole("button", { name: "Öneriyi uygula" })).toBeDisabled();
  });
  it("cancels pending requests and ignores a response that arrives afterwards", async () => {
    let resolve!: (response: Response) => void; let signal!: AbortSignal; const onApply = vi.fn();
    vi.stubGlobal("fetch", vi.fn((_url, init) => { signal = init.signal; return new Promise<Response>(done => { resolve = done; }); }));
    render(<AIContentReview {...props} onApply={onApply} />); start();
    fireEvent.click(screen.getByRole("button", { name: "İptal et" }));
    expect(signal.aborted).toBe(true); resolve(response());
    await waitFor(() => expect(screen.queryByRole("heading", { name: "AI önerisini inceleyin" })).toBeNull());
    expect(onApply).not.toHaveBeenCalled();
  });
  it.each([401, 429, 503])("shows service error %s and preserves the original", async status => {
    const onApply = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ success: false, error: "Servis kullanılamıyor." }, status)));
    render(<AIContentReview {...props} onApply={onApply} />); start();
    expect(await screen.findByRole("alert")).toHaveTextContent("Servis kullanılamıyor. Mevcut metniniz korundu.");
    expect(onApply).not.toHaveBeenCalled(); expect(screen.getByRole("button", { name: props.label })).toBeEnabled();
  });
  it("rejects malformed success responses", async () => {
    const onApply = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ success: true, enhanced: null })));
    render(<AIContentReview {...props} onApply={onApply} />); start();
    expect(await screen.findByRole("alert")).toHaveTextContent("geçerli bir öneri döndürmedi"); expect(onApply).not.toHaveBeenCalled();
  });
  it("reviews generated summaries before applying them", async () => {
    const onApply = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ success: true, summary: "Reviewed summary", warnings: [] })));
    render(<AIContentReview {...props} content="Existing summary" endpoint="/api/generate-summary" responseField="summary" onApply={onApply} />); start();
    await screen.findByRole("button", { name: "Öneriyi uygula" }); expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi uygula" })); expect(onApply).toHaveBeenCalledWith("Reviewed summary");
  });
});
