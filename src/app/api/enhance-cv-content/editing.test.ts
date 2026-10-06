// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as enhance } from "./route";
import { POST as summary } from "../generate-summary/route";

const mocks = vi.hoisted(() => ({ session: vi.fn(), enhance: vi.fn(), summary: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/llm-client", () => ({ enhanceCVContent: mocks.enhance, generateCVSummary: mocks.summary }));
const profile = { personalInfo: { fullName: "Ayşe", title: "Developer", summary: "Shipped 12 projects." },
  experiences: [{ company: "Company", position: "Developer", startDate: "2021-04", endDate: "", current: true, bullets: ["Shipped 12 projects."] }],
  skills: { technical: ["React"], soft: [] } };
const request = (body: unknown) => new NextRequest("http://localhost/api/test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-only");
  vi.stubEnv("OPENAI_API_KEY", "");
  mocks.session.mockResolvedValue({ id: "owner" });
  mocks.enhance.mockResolvedValue({ enhanced: "Improved", alternatives: ["A", "B"], warnings: ["Review new number"] });
  mocks.summary.mockResolvedValue({ summary: "Summary", keywords: ["React"], warnings: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe("professional CV editing routes", () => {
  it("authenticates both endpoints even without middleware", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await enhance(request({ content: "Text", contentType: "bullet" }))).status).toBe(401);
    expect((await summary(request(profile))).status).toBe(401);
    expect(mocks.enhance).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("returns actionable configuration errors without calling a provider", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", " ");
    for (const response of [await enhance(request({ content: "Text", contentType: "bullet" })), await summary(request(profile))]) {
      expect(response.status).toBe(503);
      expect((await response.json()).error).toContain("yapılandırılmamış");
    }
    expect(mocks.enhance).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("passes the requested language and target role and exposes review warnings", async () => {
    const response = await enhance(request({ content: "12 projects", contentType: "bullet", context: "React", cvLang: "en", targetRole: "Senior developer" }));
    expect(mocks.enhance).toHaveBeenCalledWith("12 projects", "bullet", "React", { cvLang: "en", targetRole: "Senior developer" });
    expect(await response.json()).toMatchObject({ success: true, warnings: ["Review new number"] });
  });
  it("preserves the existing summary and full experience date context", async () => {
    expect((await summary(request({ ...profile, cvLang: "en", targetRole: "Developer" }))).status).toBe(200);
    expect(mocks.summary).toHaveBeenCalledWith(profile.personalInfo, profile.experiences, profile.skills,
      { cvLang: "en", targetRole: "Developer", existingSummary: profile.personalInfo.summary });
  });
  it("supports the old request shape with a Turkish default and an explicit existing summary", async () => {
    await summary(request({ ...profile, existingSummary: "Explicit source" }));
    expect(mocks.summary.mock.calls[0][3]).toEqual({ cvLang: "tr", targetRole: undefined, existingSummary: "Explicit source" });
    await enhance(request({ content: "Text", contentType: "summary" }));
    expect(mocks.enhance.mock.calls[0][3].cvLang).toBe("tr");
  });
  it.each([{ cvLang: "de" }, { targetRole: "x".repeat(201) }])("rejects unsupported options before AI processing: %j", async options => {
    expect((await enhance(request({ content: "Text", contentType: "title", ...options }))).status).toBe(400);
    expect((await summary(request({ ...profile, ...options }))).status).toBe(400);
    expect(mocks.enhance).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON as a request error", async () => {
    const invalid = () => new NextRequest("http://localhost/api/test", { method: "POST", body: "{" });
    expect((await enhance(invalid())).status).toBe(400);
    expect((await summary(invalid())).status).toBe(400);
  });
  it("does not log personal profile text when a provider fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.enhance.mockRejectedValue(new Error("Secret private profile"));
    mocks.summary.mockRejectedValue(new Error("Secret private profile"));
    expect((await enhance(request({ content: "Text", contentType: "summary" }))).status).toBe(502);
    expect((await summary(request(profile))).status).toBe(502);
    expect(JSON.stringify(log.mock.calls)).not.toContain("Secret private profile");
    log.mockRestore();
  });
});
