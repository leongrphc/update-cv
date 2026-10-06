import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export function parseWranglerJson(output) {
  // Remote SQL file imports emit progress lines even with --json.
  const start = output.search(/^\s*\[/m);
  if (start < 0) throw new Error("Wrangler did not return a JSON result.");
  const result = JSON.parse(output.slice(start));
  if (!Array.isArray(result) || result.some(item => typeof item.success !== "boolean")) {
    throw new Error("Wrangler returned an unexpected JSON result.");
  }
  return result;
}

// D1's first deployment predates Prisma migration history. Reconcile only the
// additive statements already reviewed in the repository's migrations.
export function buildSchemaPlan(objects, cvColumns) {
  const existing = new Set(objects.map(({ name }) => name));
  const columns = new Set(cvColumns.map(({ name }) => name));
  const statements = [];
  for (const migration of readdirSync(resolve("prisma/migrations")).sort()) {
    if (migration === "migration_lock.toml") continue;
    const sql = readFileSync(resolve("prisma/migrations", migration, "migration.sql"), "utf8")
      .replace(/--[^\n]*/g, "");
    for (const fragment of sql.split(";")) {
      const statement = fragment.trim();
      if (!statement) continue;
      const create = statement.match(/^CREATE (?:UNIQUE )?(?:TABLE|INDEX) "([^"]+)"/);
      const add = statement.match(/^ALTER TABLE "CreatedCV" ADD COLUMN "([^"]+)"/);
      if (create) {
        if (!existing.has(create[1])) {
          statements.push(`${statement};`);
          existing.add(create[1]);
        }
      } else if (add) {
        if (!columns.has(add[1])) {
          statements.push(`${statement};`);
          columns.add(add[1]);
        }
      } else {
        throw new Error(`Migration ${migration} needs manual review: only CREATE and ADD COLUMN are supported.`);
      }
    }
  }
  return statements;
}
