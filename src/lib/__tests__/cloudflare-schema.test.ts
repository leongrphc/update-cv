// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error Node deployment script is also tested against real SQLite.
import { buildSchemaPlan, parseWranglerJson } from "../../../scripts/cloudflare-schema.mjs";

function migrate(db: DatabaseSync) {
  const plan = buildSchemaPlan(
    db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'index')").all(),
    db.prepare('PRAGMA table_info("CreatedCV")').all(),
  );
  for (const statement of plan) db.exec(statement);
  return plan;
}

describe("additive Cloudflare schema migration", () => {
  it("accepts remote import progress before the JSON result and rejects missing results", () => {
    expect(parseWranglerJson('├ Checking if file needs uploading\n├ Import complete\n[\n{"success":true,"results":[]}\n]'))
      .toEqual([{ success: true, results: [] }]);
    expect(parseWranglerJson('[{"success":false,"results":[]}]')[0].success).toBe(false);
    expect(() => parseWranglerJson("Import was interrupted")).toThrow("did not return");
    expect(() => parseWranglerJson('[{"message":"not a query result"}]')).toThrow("unexpected");
  });
  it("initializes a fresh D1 schema and is safe to repeat", () => {
    const db = new DatabaseSync(":memory:");
    try {
      expect(migrate(db).length).toBeGreaterThan(0);
      expect(migrate(db)).toEqual([]);
      const columns = db.prepare('PRAGMA table_info("CreatedCV")').all().map(({ name }) => name);
      expect(columns).toEqual(expect.arrayContaining(["theme", "cvLang", "shareToken", "customSections", "targetRole"]));
    } finally { db.close(); }
  });
  it("keeps legacy CVs and users while adding missing tables and default values", () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(readFileSync("prisma/migrations/20260505000000_baseline/migration.sql", "utf8"));
      db.exec('DROP TABLE "PasswordReset"; DROP TABLE "Notification"; DROP TABLE "JobAlert";');
      db.exec(`INSERT INTO "User" (id,email,updatedAt) VALUES ('owner','owner@example.com',CURRENT_TIMESTAMP);
        INSERT INTO "CreatedCV" (id,userId,personalInfo,experiences,educations,skills,updatedAt)
        VALUES ('saved','owner','{"fullName":"Existing candidate"}','[]','[]','{}',CURRENT_TIMESTAMP);`);
      migrate(db);
      expect(db.prepare('SELECT COUNT(*) AS count FROM "User"').get()?.count).toBe(1);
      const saved = db.prepare('SELECT * FROM "CreatedCV" WHERE id=?').get("saved");
      expect(saved?.personalInfo).toBe('{"fullName":"Existing candidate"}');
      expect(saved?.cvLang).toBe("tr");
      expect(saved?.customSections).toBe("[]");
      expect(saved?.isPublic).toBe(0);
      expect(migrate(db)).toEqual([]);
      expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally { db.close(); }
  });
});
