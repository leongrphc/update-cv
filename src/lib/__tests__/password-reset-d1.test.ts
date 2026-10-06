// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import type { CloudflareDatabase } from "@/lib/cloudflare-prisma";
import { consumeResetTokenAndUpdatePassword } from "@/lib/password-reset";

const mocks = vi.hoisted(() => ({ database: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/cloudflare-prisma", () => ({ getD1Database: mocks.database }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
let runtime: Miniflare;
let database: CloudflareDatabase;
const now = new Date("2026-10-06T12:00:00.000Z");
const record = { id: "reset", userId: "owner" };

beforeAll(async () => {
  runtime = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: "reset-tests", modules: true,
    script: "export default { fetch() { return new Response('OK'); } }",
    compatibilityDate: "2026-10-06", d1Databases: ["DB"] }] }));
  database = await runtime.getD1Database("DB") as unknown as CloudflareDatabase;
  await database.exec(`CREATE TABLE "User" (id TEXT PRIMARY KEY, passwordHash TEXT, updatedAt DATETIME);
    CREATE TABLE "PasswordReset" (id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES "User"(id), used BOOLEAN NOT NULL DEFAULT 0, expiresAt DATETIME);`);
}, 30_000);
afterAll(async () => { await runtime?.dispose(); });
beforeEach(async () => {
  vi.clearAllMocks();
  mocks.database.mockReturnValue(database);
  await database.exec('DROP TRIGGER IF EXISTS reject_claim; DELETE FROM "PasswordReset"; DELETE FROM "User";');
  await database.prepare('INSERT INTO "User" VALUES (?, ?, ?)').bind("owner", "old-password", now.toISOString()).run();
  await database.prepare('INSERT INTO "PasswordReset" VALUES (?, ?, ?, ?)').bind(record.id, record.userId, 0, "2026-10-06T13:00:00.000Z").run();
});
const password = () => database.prepare('SELECT passwordHash FROM "User" WHERE id = ?').bind("owner").first<string>("passwordHash");
const used = () => database.prepare('SELECT used FROM "PasswordReset" WHERE id = ?').bind("reset").first<number>("used");

describe("atomic D1 password reset batch", () => {
  it("updates the password and consumes the token, then rejects replay", async () => {
    await consumeResetTokenAndUpdatePassword(record, "new-password", now);
    expect(await password()).toBe("new-password");
    expect(await used()).toBe(1);
    await expect(consumeResetTokenAndUpdatePassword(record, "replayed-password", now)).rejects.toThrow("INVALID_RESET_TOKEN");
    expect(await password()).toBe("new-password");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("allows only one concurrent request to set a password", async () => {
    const outcomes = await Promise.allSettled([
      consumeResetTokenAndUpdatePassword(record, "request-one", now),
      consumeResetTokenAndUpdatePassword(record, "request-two", now),
    ]);
    expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(result => result.status === "rejected")).toHaveLength(1);
    expect(["request-one", "request-two"]).toContain(await password());
    expect(await used()).toBe(1);
  });
  it("rechecks expiry after the initial route lookup", async () => {
    await expect(consumeResetTokenAndUpdatePassword(record, "new-password", new Date("2026-10-06T14:00:00Z"))).rejects.toThrow("INVALID_RESET_TOKEN");
    expect(await password()).toBe("old-password");
    expect(await used()).toBe(0);
  });
  it("supports legacy millisecond expirations and rejects a mismatched owner", async () => {
    await database.prepare('UPDATE "PasswordReset" SET expiresAt = ?').bind(new Date("2026-10-06T13:00:00Z").getTime()).run();
    await expect(consumeResetTokenAndUpdatePassword({ ...record, userId: "someone-else" }, "bad-password", now)).rejects.toThrow("INVALID_RESET_TOKEN");
    expect(await password()).toBe("old-password");
    await consumeResetTokenAndUpdatePassword(record, "new-password", now);
    expect(await password()).toBe("new-password");
  });
  it("rolls back the password if token consumption fails inside the batch", async () => {
    await database.prepare(`CREATE TRIGGER reject_claim BEFORE UPDATE ON "PasswordReset"
      BEGIN SELECT RAISE(ABORT, 'forced claim failure'); END`).run();
    await expect(consumeResetTokenAndUpdatePassword(record, "new-password", now)).rejects.toThrow();
    expect(await password()).toBe("old-password");
    expect(await used()).toBe(0);
  });
});
