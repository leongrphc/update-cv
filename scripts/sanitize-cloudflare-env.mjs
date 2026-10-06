import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";

// OpenNext copies local .env files into the Worker. Production server secrets
// must come exclusively from Cloudflare bindings, never a developer's laptop.
const file = resolve(".open-next/cloudflare/next-env.mjs");
const source = readFileSync(file, "utf8");
const exports = [...source.matchAll(/export const (\w+) = (\{[^\n]*\});/g)];
if (!exports.length) throw new Error("Unrecognized OpenNext environment format; refusing deployment.");
const sanitized = exports.map(([, name, json]) => {
  const values = Object.fromEntries(Object.entries(JSON.parse(json)).filter(([key]) => key.startsWith("NEXT_PUBLIC_")));
  return `export const ${name} = ${JSON.stringify(values)};`;
}).join("\n");
writeFileSync(file, `${sanitized}\n`);
function removeEnvFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) removeEnvFiles(path);
    else if (/^\.env(?:\.|$)/.test(entry.name)) unlinkSync(path);
  }
}
removeEnvFiles(resolve(".open-next/server-functions"));
console.log("Cloudflare bundle uses server secrets from Worker bindings only.");
