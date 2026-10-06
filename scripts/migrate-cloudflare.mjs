import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSchemaPlan, parseWranglerJson } from "./cloudflare-schema.mjs";

const remote = process.argv.includes("--remote");
const apply = process.argv.includes("--apply");
const database = "cv-db";
const cli = resolve("node_modules/wrangler/bin/wrangler.js");
const target = remote ? "--remote" : "--local";
const run = (...args) => execFileSync(process.execPath, [cli, ...args], {
  encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024,
});
const query = (sql) => {
  const response = parseWranglerJson(run("d1", "execute", database, target, "--command", sql, "--json"));
  if (response.some(({ success }) => !success)) throw new Error("D1 query failed");
  return response[0].results;
};
const inspect = () => buildSchemaPlan(
  query("SELECT name FROM sqlite_master WHERE type IN ('table', 'index')"),
  query('PRAGMA table_info("CreatedCV")'),
);
const plan = inspect();
console.log(`${remote ? "Remote" : "Local"} D1: ${plan.length} additive schema statements pending.`);
if (!plan.length || !apply) {
  if (plan.length) console.log("Run again with --apply to back up and apply these migrations.");
} else {
  const directory = resolve(".agent/cloudflare");
  mkdirSync(directory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const backup = resolve(directory, `${database}-${stamp}.sql`);
  run("d1", "export", database, target, "--output", backup);
  console.log(`Backup saved: ${backup}`);
  const file = resolve(directory, `migration-${stamp}.sql`);
  writeFileSync(file, plan.join("\n\n"));
  const result = parseWranglerJson(run("d1", "execute", database, target, "--file", file, "--json"));
  if (result.some(({ success }) => !success)) throw new Error("D1 migration failed; backup has been retained.");
  if (inspect().length) throw new Error("D1 schema verification failed; inspect before deployment.");
  console.log("D1 schema verified. Existing records were retained.");
}
