import assert from "node:assert/strict";
import React from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:8799";
const request = (path, options = {}) => fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(30_000) });
assert.equal((await request("/")).status, 200, "Home page");
assert.equal((await request("/login")).status, 200, "Login page");
assert.equal((await request("/api/my-cvs")).status, 401, "Private CVs require a session");
const login = await request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "cloudflare-deployment-check@example.invalid", password: "InvalidPassword123" }) });
assert.equal(login.status, 401, "D1-backed login must reject nonexistent accounts without a server error");
const share = await request("/share/deployment-check-no-such-token");
assert.equal(share.status, 200, "D1 sharing schema");
assert.match(await share.text(), /CV Bulunamadı/, "Missing shares must not expose a CV");
const worker = "/pdfjs/pdf.worker-5.4.296.min.mjs";
const response = await request(worker);
assert.equal(response.status, 200, "PDF worker asset");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(readFileSync(`public${worker}`)), "PDF worker matches this release");
const font = await request("/fonts/open-sans/open-sans-regular.ttf");
assert.equal(font.status, 200, "PDF font asset");
const pdf = await renderToBuffer(React.createElement(Document, {}, React.createElement(Page, {},
  React.createElement(Text, {}, "Deployment PDF test. Developer built 12 projects."))));
const form = new FormData();
form.set("file", new File([pdf], "deployment-check.pdf", { type: "application/pdf" }));
const parsed = await request("/api/parse-pdf", { method: "POST", body: form });
assert.equal(parsed.status, 200, "PDF text extraction in the Cloudflare runtime");
assert.match((await parsed.json()).text, /built 12 projects/);
console.log(`Cloudflare read-only checks passed: ${base}`);
