import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync, mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import React from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";

const cv = {
  personalInfo: { fullName: "Ayşe Öztürk", title: "", email: "", phone: "", location: "İstanbul",
    summary: "Mevcut özet", linkedinUrl: "", websiteUrl: "" },
  experiences: [{ id: "import-exp", position: "Geliştirici", company: "Örnek", location: "", startDate: "2020", endDate: "", current: false, bullets: ["12 projeyi tamamladım."] }],
  educations: [], skills: { technical: ["TypeScript"], soft: [], languages: [{ id: "import-lang", language: "İngilizce", level: "" }], certifications: [] },
  templateId: "classic", cvLang: "tr",
};
const imported = { success: true, cv, sourceText: "Ayşe Öztürk\nDeneyim\n12 projeyi tamamladım.\nProjeler\nÖzgün proje açıklaması",
  warnings: ["Telefon PDF’de bulunamadı.", "Projeler bölümü yeni PDF’ye otomatik eklenmez."],
  unmappedSections: [{ heading: "Projeler", content: "Özgün proje açıklaması" }] };

const baseline = process.argv.includes("--baseline");
const directory = mkdtempSync(join(tmpdir(), "update-cv-editor-"));
const env = { ...process.env, NODE_ENV: "production",
  DATABASE_URL: `file:${join(directory, "editor.db").replaceAll("\\", "/")}`,
  JWT_SECRET: randomBytes(32).toString("hex"), NEXT_TELEMETRY_DISABLED: "1",
  GOOGLE_GENERATIVE_AI_API_KEY: "", OPENAI_API_KEY: "" };
let server, browser;
let output = "";
mkdirSync(".agent", { recursive: true });

try {
  execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], { env, stdio: "pipe" });
  const probe = createServer();
  await new Promise((done) => probe.listen(0, "127.0.0.1", done));
  const port = probe.address().port;
  await new Promise((done) => probe.close(done));
  server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Starting. */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.ok(ready, "Application did not start");
  const response = await fetch(`${base}/api/auth/register`, { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Editor Test", email: "editor@example.com", password: "EditorPassword123" }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie").split(";")[0].slice("session=".length);
  browser = await chromium.launch({ ...(process.platform === "win32" ? { channel: "chrome" } : {}) });
  const pdfBytes = await renderToBuffer(React.createElement(Document, {}, React.createElement(Page, {},
    React.createElement(Text, {}, "Existing CV candidate. Developer at Example. Built 12 projects."))));
  for (const [name, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    await context.addCookies([{ name: "session", value: cookie, url: base }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/create-cv`);
    await expect(page.getByRole("heading", { name: "Kişisel Bilgiler", exact: true })).toBeVisible();
    if (baseline) {
      await page.screenshot({ path: `.agent/editor-before-${name}.png`, fullPage: true });
    } else {
      const original = { ...cv, personalInfo: { ...cv.personalInfo, fullName: "Önceki Aday" } };
      const savedResponse = await context.request.post(`${base}/api/save-cv`, { data: original });
      assert.equal(savedResponse.status(), 200);
      const { id } = await savedResponse.json();
      await page.evaluate((data) => sessionStorage.setItem("editCreatedCV", JSON.stringify(data)), { ...original, id });
      await page.goto(`${base}/create-cv?edit=true`);
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      const file = { name: `${"uzun-dosya-adi-".repeat(8)}.pdf`, mimeType: "application/pdf", buffer: pdfBytes };
      await page.getByLabel("CV PDF dosyası", { exact: true }).setInputFiles(file);
      await expect(page.getByRole("region", { name: "Mevcut PDF CV’yi düzenle" }).getByRole("alert")).toContainText("AI bağlantısı henüz yapılandırılmamış", { timeout: 15_000 });
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      // Real PDF parsing/missing configuration above; model output below is a deterministic fixture.
      await page.route("**/api/import-cv", (route) => route.fulfill({ json: imported }));
      await page.getByLabel("CV PDF dosyası", { exact: true }).setInputFiles(file);
      await expect(page.getByRole("heading", { name: "Aktarmadan önce kontrol edin" })).toBeVisible();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      await page.getByText("Kaynak metin ve aktarılamayan bölümler", { exact: true }).click();
      await expect(page.locator("pre")).toContainText("12 projeyi tamamladım.");
      await page.getByRole("button", { name: "Kontrol ettim, alanlara aktar" }).click();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Ayşe Öztürk");
      await expect(page.getByLabel("Telefon", { exact: true })).toHaveValue("");
      await page.getByRole("button", { name: "İçe aktarmayı geri al" }).click();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      await page.getByRole("button", { name: "Kontrol ettim, alanlara aktar" }).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
      await page.screenshot({ path: `.agent/editor-after-${name}.png`, fullPage: true });
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Sonraki" }).click();
      await page.getByRole("button", { name: "Kaydet", exact: true }).click();
      await expect(page.getByText("CV başarıyla kaydedildi!", { exact: true })).toBeVisible();
      const list = await (await context.request.get(`${base}/api/my-cvs`)).json();
      assert.equal(list.createdCVs.items.find((item) => item.id === id).personalInfo.fullName, "Önceki Aday");
      const newCV = list.createdCVs.items.find((item) => item.id !== id && item.personalInfo.fullName === "Ayşe Öztürk");
      assert.ok(newCV, "Imported PDF must create a new CV");
      assert.equal(newCV.skills.languages[0].level, "");
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Önceki" }).click();
      await expect(page.locator("pre")).toContainText("Özgün proje açıklaması");
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Sonraki" }).click();
      await page.getByRole("button", { name: "Kaydet", exact: true }).click();
      await expect(page.getByText("CV başarıyla kaydedildi!", { exact: true })).toBeVisible();
      const afterResave = await (await context.request.get(`${base}/api/my-cvs`)).json();
      assert.equal(afterResave.createdCVs.total, list.createdCVs.total, "Returning from preview must not create duplicate CVs");
      assert.deepEqual(errors, []);
    }
    await context.close();
  }
  console.log(baseline ? "Editor baseline screenshots captured" : "Editor browser checks passed");
} finally {
  await browser?.close();
  if (server && server.exitCode === null) { const stopped = once(server, "exit"); server.kill(); await stopped; }
  for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
  rmdirSync(directory);
}
