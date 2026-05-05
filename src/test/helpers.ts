import { vi } from "vitest";

export function createMockRequest(
  body: unknown,
  method: string = "POST",
  url: string = "http://localhost:3000/api/test"
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify(body) : undefined,
  });
}

export function createMockNextRequest(
  body: unknown,
  method: string = "POST",
  url: string = "http://localhost:3000/api/test"
) {
  const req = createMockRequest(body, method, url);
  return Object.assign(req, {
    nextUrl: new URL(url),
    cookies: {
      get: vi.fn(),
      getAll: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
  });
}

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

export const mockSession = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
};
