// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error Node deployment script is also tested against real SQLite.
import { buildSchemaPlan, parseWranglerJson, dateTimeColumns, dateTimeInspectionQuery, buildDateTimePlan } from "../../../scripts/cloudflare-schema.mjs";

function migrate(db: DatabaseSync) {
  const plan = buildSchemaPlan(
    db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'index')").all(),
    db.prepare('PRAGMA table_info("CreatedCV")').all(),
  );
  for (const statement of plan) db.exec(statement);
  return plan;
}

describe("additive Cloudflare schema migration", () => {
  it("converts native SQLite timestamp milliseconds without changing users, passwords or CV content", () => {
    const db = new DatabaseSync(":memory:");
    try {
      migrate(db);
      const milliseconds = Date.parse("2026-02-02T20:23:46.277Z");
      db.prepare('INSERT INTO "User" (id,email,passwordHash,createdAt,updatedAt) VALUES (?,?,?,?,?)')
        .run("legacy", "legacy@example.com", "preserved-password-hash", milliseconds, milliseconds);
      db.prepare('INSERT INTO "CreatedCV" (id,userId,personalInfo,experiences,educations,skills,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)')
        .run("cv", "legacy", '{"fullName":"Existing candidate"}', "[]", "[]", "{}", milliseconds, milliseconds);
      db.prepare('INSERT INTO "User" (id,email,createdAt,updatedAt) VALUES (?,?,?,?)')
        .run("new", "new@example.com", "2026-10-06T18:00:00.123Z", "2026-10-06T18:00:00.123Z");
      const objects = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const query = dateTimeInspectionQuery(dateTimeColumns(objects));
      const plan = buildDateTimePlan(db.prepare(query).all());
      expect(plan).toHaveLength(4);
      for (const statement of plan) db.exec(statement);
      expect(db.prepare('SELECT passwordHash,createdAt,updatedAt FROM "User" WHERE id=?').get("legacy"))
        .toEqual({ passwordHash: "preserved-password-hash", createdAt: "2026-02-02T20:23:46.277Z", updatedAt: "2026-02-02T20:23:46.277Z" });
      expect(db.prepare('SELECT personalInfo,createdAt FROM "CreatedCV" WHERE id=?').get("cv"))
        .toEqual({ personalInfo: '{"fullName":"Existing candidate"}', createdAt: "2026-02-02T20:23:46.277Z" });
      expect(db.prepare('SELECT createdAt FROM "User" WHERE id=?').get("new")?.createdAt).toBe("2026-10-06T18:00:00.123Z");
      expect(buildDateTimePlan(db.prepare(query).all())).toEqual([]);
      expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally { db.close(); }
  });

  it("rejects invalid legacy timestamps before planning any date updates", () => {
    expect(() => buildDateTimePlan([{ table_name: "User", column_name: "createdAt", numeric_count: 1, invalid_count: 1 }]))
      .toThrow("refusing conversion");
  });
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
