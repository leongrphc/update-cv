import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const directory = mkdtempSync(join(tmpdir(), "update-cv-migrations-"));
const cli = resolve("node_modules/prisma/build/index.js");
function migrate(file, args) {
  execFileSync(process.execPath, [cli, ...args], {
    env: { ...process.env, DATABASE_URL: `file:${file.replaceAll("\\", "/")}` },
    stdio: "pipe",
  });
}

try {
  for (const legacy of [false, true]) {
    const file = join(directory, legacy ? "legacy.db" : "fresh.db");
    const db = new PrismaClient({ datasourceUrl: `file:${file.replaceAll("\\", "/")}` });
    try {
      if (legacy) {
        migrate(file, ["db", "execute", "--file", "prisma/migrations/20260505000000_baseline/migration.sql", "--schema", "prisma/schema.prisma"]);
        await db.$executeRaw`INSERT INTO "CreatedCV" (id, personalInfo, experiences, educations, skills, updatedAt) VALUES ('legacy-cv', '{}', '[]', '[]', '{}', CURRENT_TIMESTAMP)`;
        migrate(file, ["migrate", "resolve", "--applied", "20260505000000_baseline"]);
      }
      migrate(file, ["migrate", "deploy"]);
      if (legacy) {
        const cv = await db.createdCV.findUniqueOrThrow({ where: { id: "legacy-cv" } });
        assert.equal(cv.isPublic, false);
        assert.equal(cv.shareToken, null);
        assert.equal(cv.cvLang, "tr");
        assert.equal(cv.theme, null);
        await db.createdCV.update({ where: { id: cv.id }, data: { isPublic: true, shareToken: "test-token" } });
        assert.equal((await db.createdCV.findFirst({ where: { shareToken: "test-token", isPublic: true } })).id, cv.id);
      } else {
        assert.equal(await db.createdCV.count(), 0);
      }
      console.log(`${legacy ? "Existing" : "Fresh"} database migrations passed`);
    } finally {
      await db.$disconnect();
    }
  }
} finally {
  // Only files created inside this unique temporary directory are removed.
  for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
  rmdirSync(directory);
}
