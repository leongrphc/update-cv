// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { middleware, config } from "./middleware";

describe("API access and request limits", () => {
  beforeEach(() => { vi.useRealTimers(); });

  it.each(["chat", "find-jobs", "analyze-job", "import-cv"])("rejects unauthenticated %s requests", async (route) => {
    const path = `/api/${route}`;
    expect(config.matcher).toContain(`${path}/:path*`);
    expect((await middleware(new NextRequest(`http://localhost${path}`, { method: "POST" }))).status).toBe(401);
  });

  it("limits AI requests by verified user, even when the IP changes", async () => {
    const token = await new SignJWT({ userId: "rate-test-user" }).setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h").sign(new TextEncoder().encode(process.env.JWT_SECRET));
    for (let i = 0; i < 16; i++) {
      const response = await middleware(new NextRequest("http://localhost/api/chat", {
        method: "POST", headers: { cookie: `session=${token}`, "x-forwarded-for": `192.0.2.${i}` },
      }));
      expect(response.status).toBe(i < 15 ? 200 : 429);
      if (i === 15) expect(response.headers.get("retry-after")).toBe("60");
    }
  });

  it("limits repeated login attempts", async () => {
    for (let i = 0; i < 11; i++) {
      const response = await middleware(new NextRequest("http://localhost/api/auth/login", {
        method: "POST", headers: { "x-forwarded-for": "192.0.2.100" },
      }));
      expect(response.status).toBe(i < 10 ? 200 : 429);
    }
  });
});
