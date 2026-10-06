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

// Native Prisma SQLite writes milliseconds; Prisma 5's D1 WASM engine reads ISO
// strings. Normalize only declared DateTime columns, retaining the exact instant.
export function dateTimeColumns(objects) {
  const tables = new Set(objects.map(({ name }) => name));
  const baseline = readFileSync(resolve("prisma/migrations/20260505000000_baseline/migration.sql"), "utf8");
  return [...baseline.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)]
    .filter(([, table]) => tables.has(table))
    .flatMap(([, table, definition]) => [...definition.matchAll(/"([^"]+)" DATETIME/g)]
      .map(([, column]) => ({ table, column })));
}

export function dateTimeInspectionQuery(columns) {
  return columns.map(({ table, column }) => `SELECT '${table}' AS table_name, '${column}' AS column_name,
    COUNT(*) AS numeric_count,
    COALESCE(SUM(CASE WHEN strftime('%Y-%m-%dT%H:%M:%fZ', "${column}" / 1000.0, 'unixepoch') IS NULL THEN 1 ELSE 0 END), 0) AS invalid_count
    FROM "${table}" WHERE typeof("${column}") IN ('integer', 'real')`).join("\nUNION ALL\n");
}

export function buildDateTimePlan(inspections) {
  if (inspections.some(({ invalid_count }) => invalid_count > 0)) {
    throw new Error("A legacy timestamp is outside the supported date range; refusing conversion.");
  }
  return inspections.filter(({ numeric_count }) => numeric_count > 0).map(({ table_name: table, column_name: column }) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(table) || !/^[A-Za-z][A-Za-z0-9_]*$/.test(column)) {
      throw new Error("Invalid DateTime column identifier.");
    }
    return `UPDATE "${table}" SET "${column}" = strftime('%Y-%m-%dT%H:%M:%fZ', "${column}" / 1000.0, 'unixepoch') WHERE typeof("${column}") IN ('integer', 'real');`;
  });
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
