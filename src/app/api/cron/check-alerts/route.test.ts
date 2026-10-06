// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
const check = vi.hoisted(() => vi.fn().mockResolvedValue({ checked: 0, newMatches: 0 }));
vi.mock("@/lib/job-alert-checker", () => ({ checkJobAlerts: check }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const request = (authorization?: string) => new NextRequest("http://localhost/api/cron/check-alerts", {
  method: "POST", headers: authorization ? { authorization } : {},
});
describe("Cron authentication", () => {
  it("does not run when its secret is missing", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(request())).status).toBe(503);
    expect(check).not.toHaveBeenCalled();
  });
  it("rejects incorrect secrets", async () => {
    vi.stubEnv("CRON_SECRET", "correct");
    expect((await POST(request("Bearer wrong"))).status).toBe(401);
    expect(check).not.toHaveBeenCalled();
  });
  it("runs only with the configured secret", async () => {
    vi.stubEnv("CRON_SECRET", "correct");
    expect((await POST(request("Bearer correct"))).status).toBe(200);
    expect(check).toHaveBeenCalledOnce();
  });
});
