import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const { version } = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
const target = resolve("public/pdfjs");
mkdirSync(target, { recursive: true });
// The viewer and worker must use the exact same installed PDF.js version.
copyFileSync(join(source, "legacy/build/pdf.worker.min.mjs"), join(target, `pdf.worker-${version}.min.mjs`));
copyFileSync(join(source, "LICENSE"), join(target, "LICENSE"));
