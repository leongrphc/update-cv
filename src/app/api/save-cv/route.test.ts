// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({ session: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { createdCV: { create: mocks.create, updateMany: mocks.update } } }));

const cv = {
  personalInfo: {
    fullName: "Test User", title: "Developer", email: "test@example.com", phone: "123",
    location: "Ankara", linkedinUrl: "https://linkedin.com/in/test", websiteUrl: "https://example.com",
    summary: "Professional summary",
  },
  experiences: [{ id: "exp", position: "Developer", company: "Example", location: "Remote",
    startDate: "2020-01", endDate: "2024-01", current: false, bullets: ["Built software"] }],
  educations: [{ id: "edu", school: "University", degree: "BSc", field: "Computer Science",
    startDate: "2015", endDate: "2019", gpa: "3.5", description: "Honors" }],
  skills: { technical: ["TypeScript"], soft: ["Communication"],
    languages: [{ id: "lang", language: "English", level: "C1" }],
    certifications: [{ id: "cert", name: "Certificate", issuer: "Example", date: "2024" }] },
  templateId: "modern",
};

const request = (body: unknown) => new NextRequest("http://localhost/api/save-cv", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

describe("CV persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ id: "owner" });
    mocks.create.mockResolvedValue({ id: "saved-cv" });
    mocks.update.mockResolvedValue({ count: 1 });
  });

  it("preserves every personal, experience, education, language and certification field", async () => {
    expect((await POST(request(cv))).status).toBe(200);
    const { data } = mocks.create.mock.calls[0][0];
    for (const key of ["personalInfo", "experiences", "educations", "skills"] as const) {
      expect(JSON.parse(data[key])).toEqual(cv[key]);
    }
    expect(data.userId).toBe("owner");
  });

  it("allows the blank optional email submitted by the wizard", async () => {
    expect((await POST(request({ ...cv, personalInfo: { ...cv.personalInfo, email: "" } }))).status).toBe(200);
  });

  it("preserves custom section text and order, and the target role", async () => {
    const customSections = [{ id: "publication", title: "Yayınlar", content: "Özgün çalışma\nİkinci satır" },
      { id: "projects", title: "Projeler", content: "12 proje" }];
    expect((await POST(request({ ...cv, customSections, targetRole: "Senior Developer" }))).status).toBe(200);
    const { data } = mocks.create.mock.calls[0][0];
    expect(JSON.parse(data.customSections)).toEqual(customSections);
    expect(data.targetRole).toBe("Senior Developer");
  });

  it("rejects oversized custom sections without modifying the CV", async () => {
    expect((await POST(request({ ...cv, customSections: [{ id: "x", title: "X", content: "x".repeat(50_001) }] }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects invalid language levels without writing a CV", async () => {
    const response = await POST(request({ ...cv, skills: { ...cv.skills,
      languages: [{ id: "lang", language: "English", level: "invalid" }] } }));
    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("prevents unauthenticated saves", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await POST(request(cv))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("preserves the selected CV language", async () => {
    expect((await POST(request({ ...cv, cvLang: "en" }))).status).toBe(200);
    expect(mocks.create.mock.calls[0][0].data.cvLang).toBe("en");
  });

  it("persists font, size and both theme colors on edits", async () => {
    const theme = { primaryColor: "#123456", accentColor: "#059669", fontFamily: "Lato", fontSize: 12.5 };
    expect((await POST(request({ ...cv, id: "existing", theme }))).status).toBe(200);
    expect(JSON.parse(mocks.update.mock.calls[0][0].data.theme)).toEqual(theme);
  });
  it.each([{ primaryColor: "url(javascript:test)", accentColor: "#059669", fontFamily: "Lato", fontSize: 10 },
    { primaryColor: "#123456", accentColor: "#059669", fontFamily: "unknown", fontSize: 10 },
    { primaryColor: "#123456", accentColor: "#059669", fontFamily: "Lato", fontSize: 100 }])("rejects invalid export themes", async (theme) => {
    expect((await POST(request({ ...cv, theme }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("updates the owner's existing CV without creating a duplicate", async () => {
    const response = await POST(request({ ...cv, id: "existing-cv", cvLang: "en" }));
    expect((await response.json()).id).toBe("existing-cv");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "existing-cv", userId: "owner" }, data: expect.objectContaining({ cvLang: "en" }),
    }));
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("cannot edit a CV owned by another user", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    expect((await POST(request({ ...cv, id: "other-cv" }))).status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
