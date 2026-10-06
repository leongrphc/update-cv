// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as generate } from "./generate/route";
import { POST as evaluate } from "./evaluate/route";
import { GET } from "./[sessionId]/route";

const mocks = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn(), create: vi.fn(), generate: vi.fn(), evaluate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { interviewSession: { findFirst: mocks.find, create: mocks.create } } }));
vi.mock("@/lib/llm-client", () => ({ generateInterviewQuestions: mocks.generate, evaluateInterviewAnswer: mocks.evaluate }));
const request = (body?: unknown) => new NextRequest("http://localhost/api/interview/test", body ? {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
} : {});
const context = { params: Promise.resolve({ sessionId: "other-session" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "owner" });
  mocks.find.mockResolvedValue(null);
});
describe("Interview ownership", () => {
  it("binds newly generated sessions to the signed-in user", async () => {
    mocks.generate.mockResolvedValue({ targetRole: "Developer", questions: [] });
    mocks.create.mockResolvedValue({ id: "new-session", targetRole: "Developer", questions: [], totalQuestions: 0 });
    expect((await generate(request({ cvText: "CV", jobDescription: "Job" }))).status).toBe(200);
    expect(mocks.create.mock.calls[0][0].data.userId).toBe("owner");
  });

  it("returns no interview belonging to another user", async () => {
    expect((await GET(request(), context)).status).toBe(404);
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "other-session", userId: "owner" } }));
  });

  it("cannot evaluate another user's interview", async () => {
    const response = await evaluate(request({ sessionId: "other-session", questionId: "question", answer: "Answer" }));
    expect(response.status).toBe(404);
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "other-session", userId: "owner" } }));
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated generation, reading, and evaluation", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await generate(request({ cvText: "CV", jobDescription: "Job" }))).status).toBe(401);
    expect((await GET(request(), context)).status).toBe(401);
    expect((await evaluate(request({ sessionId: "session", questionId: "question", answer: "Answer" }))).status).toBe(401);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
