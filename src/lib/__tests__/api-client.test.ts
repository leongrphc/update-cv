import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api-client";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return success on valid response", async () => {
    const mockData = { name: "test" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    );

    const result = await apiFetch("/api/test");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });

  it("should return error on 400 response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Bad request" }), { status: 400 })
    );

    const result = await apiFetch("/api/test");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Bad request");
  });

  it("should return Turkish error message for 401", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 401 })
    );

    const result = await apiFetch("/api/test");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
  });

  it("should retry on 500 error", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 500 })
    );
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    const result = await apiFetch("/api/test", {}, { maxRetries: 1, baseDelay: 10 });
    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("should retry on network error", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    const result = await apiFetch("/api/test", {}, { maxRetries: 1, baseDelay: 10 });
    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("should return error after max retries exceeded", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const result = await apiFetch("/api/test", {}, { maxRetries: 2, baseDelay: 10 });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
