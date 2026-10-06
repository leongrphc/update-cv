// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { createdCV: { findFirst: mocks.find } } }));
const get = () => GET(new Request("http://localhost/api/my-cvs/cv-id"), { params: Promise.resolve({ id: "cv-id" }) });
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue({ id: "owner" }); mocks.find.mockResolvedValue(null); });
it("requires authentication to open a CV", async () => {
  mocks.session.mockResolvedValue(null);
  expect((await get()).status).toBe(401);
  expect(mocks.find).not.toHaveBeenCalled();
});
it("scopes direct links by owner and hides inaccessible CVs", async () => {
  expect((await get()).status).toBe(404);
  expect(mocks.find).toHaveBeenCalledWith({ where: { id: "cv-id", userId: "owner" } });
});
it("returns persisted editing data including the theme", async () => {
  const theme = { fontFamily: "Lato", fontSize: 12, primaryColor: "#123456", accentColor: "#059669" };
  mocks.find.mockResolvedValue({ id: "cv-id", personalInfo: '{"fullName":"Test"}', experiences: "[]", educations: "[]",
    skills: "{}", templateId: "classic", cvLang: "en", theme: JSON.stringify(theme), updatedAt: new Date() });
  expect((await (await get()).json()).cv.theme).toEqual(theme);
});
