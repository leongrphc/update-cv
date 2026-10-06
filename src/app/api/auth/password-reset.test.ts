// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as forgot } from "./forgot-password/route";
import { POST as reset } from "./reset-password/route";
import { hashResetToken } from "@/lib/password-reset";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(), create: vi.fn(), invalidate: vi.fn(), findReset: vi.fn(), claim: vi.fn(),
  updateUser: vi.fn(), hashPassword: vi.fn(), configured: vi.fn(), send: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("@/lib/cloudflare-prisma", () => ({ getD1Database: () => null }));
vi.mock("@/lib/mail", () => ({
  isPasswordResetMailConfigured: mocks.configured,
  passwordResetOrigin: () => "https://cv.example.com",
  sendPasswordResetEmail: mocks.send,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.findUser },
  passwordReset: { create: mocks.create, updateMany: mocks.invalidate, findFirst: mocks.findReset },
  $transaction: async (fn: (tx: unknown) => unknown) => fn({
    user: { update: mocks.updateUser }, passwordReset: { updateMany: mocks.claim },
  }),
} }));
const request = (body: unknown) => new NextRequest("https://untrusted-host.example/api/auth/test", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const token = "a".repeat(64);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  mocks.findUser.mockResolvedValue({ id: "user", email: "test@example.com" });
  mocks.configured.mockReturnValue(true);
  mocks.findReset.mockResolvedValue({ id: "reset", userId: "user" });
  mocks.claim.mockResolvedValue({ count: 1 });
  mocks.hashPassword.mockResolvedValue("hashed-password");
});
afterEach(() => vi.unstubAllEnvs());

describe("Password reset delivery", () => {
  it("delivers the production link and stores only its hash", async () => {
    const response = await forgot(request({ email: "test@example.com" }));
    expect(response.status).toBe(200);
    expect((await response.json()).devResetLink).toBeUndefined();
    const link = new URL(mocks.send.mock.calls[0][1]);
    expect(link.origin).toBe("https://cv.example.com");
    const rawToken = link.searchParams.get("token")!;
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.create.mock.calls[0][0].data.token).toBe(hashResetToken(rawToken));
    expect(mocks.create.mock.calls[0][0].data.token).not.toBe(rawToken);
  });

  it("fails clearly before querying accounts if email is not configured", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await forgot(request({ email: "test@example.com" }))).status).toBe(503);
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns the same generic success for an unknown email", async () => {
    mocks.findUser.mockResolvedValue(null);
    const response = await forgot(request({ email: "unknown@example.com" }));
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("keeps development links local without sending real mail", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await forgot(request({ email: "test@example.com" }));
    expect((await response.json()).devResetLink).toContain("/reset-password?token=");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("Single-use reset tokens", () => {
  it("looks up the token hash and updates the password inside the claim transaction", async () => {
    expect((await reset(request({ token, password: "NewPassword123" }))).status).toBe(200);
    expect(mocks.findReset.mock.calls[0][0].where.token).toBe(hashResetToken(token));
    expect(mocks.claim.mock.calls[0][0].where.used).toBe(false);
    expect(mocks.updateUser).toHaveBeenCalledWith({ where: { id: "user" }, data: { passwordHash: "hashed-password" } });
  });

  it("rejects expired or previously consumed tokens", async () => {
    mocks.findReset.mockResolvedValue(null);
    expect((await reset(request({ token, password: "NewPassword123" }))).status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("prevents a second concurrent request from changing the password", async () => {
    mocks.claim.mockResolvedValue({ count: 0 });
    expect((await reset(request({ token, password: "NewPassword123" }))).status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
