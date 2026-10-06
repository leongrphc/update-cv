// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), created: vi.fn(), wasmCreated: vi.fn(), adapter: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mocks.context }));
vi.mock("@prisma/adapter-d1", () => ({ PrismaD1: class {
  constructor(database: unknown) { mocks.adapter(database); }
} }));
vi.mock("@prisma/client", () => ({ PrismaClient: class {
  user = { findUnique: vi.fn().mockResolvedValue({ id: "user" }) };
  constructor(options?: unknown) { mocks.created(options); }
  $disconnect() { return this.user; }
} }));
vi.mock("@prisma/client/wasm", () => ({ PrismaClient: class {
  user = { findUnique: vi.fn().mockResolvedValue({ id: "user" }) };
  constructor(options?: unknown) { mocks.wasmCreated(options); }
} }));
const globalState = globalThis as unknown as { prisma?: unknown };
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  delete globalState.prisma;
  vi.stubEnv("PRISMA_DATABASE_PROVIDER", "");
  mocks.context.mockImplementation(() => { throw new Error("No worker context"); });
});
afterEach(() => { vi.unstubAllEnvs(); delete globalState.prisma; });

describe("lazy Prisma client routing", () => {
  it("does not read bindings or create a client at module import", async () => {
    await import("@/lib/prisma");
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.created).not.toHaveBeenCalled();
    expect(mocks.wasmCreated).not.toHaveBeenCalled();
  });
  it("keeps a native local client and binds client methods to their receiver", async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.user.findUnique({ where: { id: "user" } });
    expect(prisma.$disconnect()).toBe(prisma.user);
    expect(mocks.created).toHaveBeenCalledTimes(1);
    expect(mocks.created).toHaveBeenCalledWith(undefined);
    expect(mocks.adapter).not.toHaveBeenCalled();
    expect(mocks.wasmCreated).not.toHaveBeenCalled();
  });
  it("caches within one execution context and isolates subsequent requests", async () => {
    const database = {};
    const context = { env: { DB: database }, ctx: {} };
    mocks.context.mockReturnValue(context);
    const { prisma } = await import("@/lib/prisma");
    const first = prisma.user;
    expect(prisma.user).toBe(first);
    mocks.context.mockReturnValue({ env: { DB: database }, ctx: {} });
    expect(prisma.user).not.toBe(first);
    expect(mocks.wasmCreated).toHaveBeenCalledTimes(2);
    expect(mocks.created).not.toHaveBeenCalled();
    expect(mocks.adapter).toHaveBeenNthCalledWith(1, database);
    expect(mocks.adapter).toHaveBeenNthCalledWith(2, database);
  });
  it("fails closed when the worker binding is missing", async () => {
    mocks.context.mockReturnValue({ env: {}, ctx: {} });
    const { prisma } = await import("@/lib/prisma");
    expect(() => prisma.user).toThrow("binding DB");
    expect(mocks.created).not.toHaveBeenCalled();
  });
  it("does not fall back to a local file when D1 is required but request context is missing", async () => {
    vi.stubEnv("PRISMA_DATABASE_PROVIDER", "d1");
    const { prisma } = await import("@/lib/prisma");
    expect(() => prisma.user).toThrow("request context");
    expect(mocks.created).not.toHaveBeenCalled();
  });
});
