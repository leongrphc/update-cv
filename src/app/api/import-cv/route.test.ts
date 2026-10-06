// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getSession } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { extractEditableCV } from "@/lib/llm-client";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/pdf-parser", () => ({ extractTextFromPDF: vi.fn() }));
vi.mock("@/lib/llm-client", () => ({ extractEditableCV: vi.fn() }));

const extracted = {
  cvLang: "tr", personalInfo: { fullName: "Ayşe Öztürk", title: "", email: "", phone: "",
    location: "İstanbul", linkedinUrl: "", websiteUrl: "", summary: "Mevcut özet" },
  experiences: [{ position: "Geliştirici", company: "Örnek", location: "", startDate: "2020",
    endDate: "", current: false, bullets: ["12 projeyi tamamladım."] }], educations: [],
  skills: { technical: ["TypeScript"], soft: [], languages: [{ language: "İngilizce", level: "" }], certifications: [] },
  warnings: [], unmappedSections: [{ heading: "Projeler", content: "Özgün proje açıklaması" }],
};
function request(contents = "%PDF-test", name = "cv.pdf", type = "application/pdf") {
  const body = new FormData();
  body.set("file", new File([contents], name, { type }));
  return new NextRequest("http://localhost/api/import-cv", { method: "POST", body });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-only");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.mocked(getSession).mockResolvedValue({ id: "owner", email: "owner@example.com" });
  vi.mocked(extractTextFromPDF).mockResolvedValue("Ayşe Öztürk\nDeneyim\n12 projeyi tamamladım.");
  vi.mocked(extractEditableCV).mockResolvedValue(extracted as Awaited<ReturnType<typeof extractEditableCV>>);
});

describe("editable CV import", () => {
  it("requires a session before reading or processing the PDF", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(extractTextFromPDF).not.toHaveBeenCalled();
  });
  it.each([["text", "cv.pdf", "application/pdf"], ["%PDF-test", "cv.txt", "application/pdf"],
    ["%PDF-test", "cv.pdf", "text/plain"]])("rejects invalid uploads", async (content, name, type) => {
    expect((await POST(request(content, name, type))).status).toBe(400);
    expect(extractEditableCV).not.toHaveBeenCalled();
  });
  it("rejects oversized files before parsing", async () => {
    expect((await POST(request("%PDF-" + "a".repeat(5 * 1024 * 1024)))).status).toBe(413);
    expect(extractTextFromPDF).not.toHaveBeenCalled();
  });
  it("reports scans without claiming to extract them", async () => {
    vi.mocked(extractTextFromPDF).mockResolvedValue("\n ");
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("OCR");
    expect(extractEditableCV).not.toHaveBeenCalled();
  });
  it("reports unreadable or encrypted PDFs", async () => {
    vi.mocked(extractTextFromPDF).mockRejectedValue(new Error("Password"));
    expect((await POST(request())).status).toBe(422);
    expect(extractEditableCV).not.toHaveBeenCalled();
  });
  it("never silently truncates long source text", async () => {
    vi.mocked(extractTextFromPDF).mockResolvedValue("a".repeat(50_001));
    expect((await POST(request())).status).toBe(413);
    expect(extractEditableCV).not.toHaveBeenCalled();
  });
  it("keeps all PDF text editable without AI configuration", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cv.personalInfo.fullName).toBe("");
    expect(body.cv.customSections[0].content).toBe(body.sourceText);
    expect(body.warnings.join(" ")).toContain("AI bağlantısı");
    expect(extractEditableCV).not.toHaveBeenCalled();
  });
  it("preserves facts, line breaks, uncertainty and unmapped sections with new entry IDs", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cv.personalInfo).toEqual(extracted.personalInfo);
    expect(body.cv.experiences[0]).toMatchObject(extracted.experiences[0]);
    expect(body.cv.experiences[0].id).toBeTruthy();
    expect(body.cv.skills.languages[0].level).toBe("");
    expect(body.cv.id).toBeUndefined();
    expect(body.sourceText).toContain("\nDeneyim\n");
    expect(body.unmappedSections).toEqual(extracted.unmappedSections);
    expect(body.warnings.join(" ")).toContain("Telefon");
    expect(body.cv.customSections[0]).toMatchObject({ title: "Projeler", content: "Özgün proje açıklaması" });
    expect(body.cv.customSections[0].id).toBeTruthy();
  });
  it("does not return invalid model output or leak source text in errors", async () => {
    vi.mocked(extractEditableCV).mockResolvedValue({ ...extracted, personalInfo: null } as never);
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).not.toHaveProperty("sourceText");
  });
});
