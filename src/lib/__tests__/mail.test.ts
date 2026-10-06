// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPasswordResetMailConfigured, passwordResetOrigin, sendPasswordResetEmail } from "@/lib/mail";
const mocks = vi.hoisted(() => ({ transport: vi.fn(), send: vi.fn().mockResolvedValue({}) }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.transport } }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("SMTP configuration", () => {
  it("requires a trusted HTTPS application origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://cv.example.com");
    expect(passwordResetOrigin("https://untrusted.example")).toBe("https://cv.example.com");
    vi.stubEnv("APP_URL", "http://cv.example.com");
    expect(isPasswordResetMailConfigured()).toBe(false);
    expect(() => passwordResetOrigin("https://untrusted.example")).toThrow();
  });

  it.each([587, 465])("uses encrypted SMTP on port %s", async (port) => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", String(port));
    vi.stubEnv("SMTP_USER", "test-user");
    vi.stubEnv("SMTP_PASSWORD", "test-only-password");
    vi.stubEnv("SMTP_FROM", "cv@example.com");
    mocks.transport.mockReturnValue({ sendMail: mocks.send });
    await sendPasswordResetEmail("recipient@example.com", "https://cv.example.com/reset-password?token=test");
    expect(mocks.transport).toHaveBeenCalledWith(expect.objectContaining({
      secure: port === 465, requireTLS: port !== 465, disableFileAccess: true, disableUrlAccess: true,
    }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "recipient@example.com" }));
  });
});
