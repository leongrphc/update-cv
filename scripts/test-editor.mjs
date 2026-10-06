import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import React from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";

const cv = {
  personalInfo: { fullName: "Ayşe Öztürk", title: "", email: "", phone: "", location: "İstanbul",
    summary: "Mevcut özet", linkedinUrl: "", websiteUrl: "" },
  experiences: [{ id: "import-exp", position: "Geliştirici", company: "Örnek", location: "", startDate: "2020", endDate: "", current: false, bullets: ["12 projeyi tamamladım."] }],
  educations: [], skills: { technical: ["TypeScript"], soft: [], languages: [{ id: "import-lang", language: "İngilizce", level: "" }], certifications: [] },
  customSections: [{ id: "project", title: "Projeler", content: "Özgün proje açıklaması" }],
  templateId: "classic", cvLang: "tr",
};
const imported = { success: true, cv, sourceText: "Ayşe Öztürk\nDeneyim\n12 projeyi tamamladım.\nProjeler\nÖzgün proje açıklaması",
  warnings: ["Telefon PDF’de bulunamadı.", "Projeler bölümü özel bölüm olarak düzenlenebilir."],
  unmappedSections: [{ heading: "Projeler", content: "Özgün proje açıklaması" }] };

const baseline = process.argv.includes("--baseline");
const baselinePreview = process.argv.includes("--baseline-preview");
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
    if (baselinePreview) {
      await page.getByLabel("Ad Soyad *", { exact: true }).fill("Ayşe Öztürk");
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Sonraki" }).click();
      await page.getByRole("button", { name: "Tema Özelleştir" }).click();
      await page.screenshot({ path: `.agent/preview-before-${name}.png`, fullPage: true });
    } else if (baseline) {
      await page.screenshot({ path: `.agent/editor-before-${name}.png`, fullPage: true });
    } else {
      const original = { ...cv, personalInfo: { ...cv.personalInfo, fullName: "Önceki Aday" } };
      const savedResponse = await context.request.post(`${base}/api/save-cv`, { data: original });
      assert.equal(savedResponse.status(), 200);
      const { id } = await savedResponse.json();
      await page.evaluate((data) => sessionStorage.setItem("editCreatedCV", JSON.stringify(data)), { ...original, id });
      await page.goto(`${base}/create-cv?edit=true`);
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      await page.getByLabel("Profesyonel Özet", { exact: true }).fill("Kaybolmayan taslak özeti");
      await page.reload();
      await expect(page.getByLabel("Profesyonel Özet", { exact: true })).toHaveValue("Kaybolmayan taslak özeti");
      const file = { name: `${"uzun-dosya-adi-".repeat(8)}.pdf`, mimeType: "application/pdf", buffer: pdfBytes };
      await page.getByLabel("CV PDF dosyası", { exact: true }).setInputFiles(file);
      await expect(page.getByRole("heading", { name: "Aktarmadan önce kontrol edin" })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("AI bağlantısı yapılandırılmamış;", { exact: false })).toBeVisible();
      await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      const editingURL = page.url();
      const savedView = await context.newPage();
      await savedView.goto(`${base}/create-cv?id=${id}&download=true`);
      await expect(savedView.getByRole("heading", { name: "Önizleme & İndirme", exact: true })).toBeVisible();
      await savedView.close();
      await page.goto(editingURL);
      await expect(page.getByLabel("Profesyonel Özet", { exact: true })).toHaveValue("Kaybolmayan taslak özeti");
      // Real manual import above; structured model output below is a deterministic fixture.
      await page.route("**/api/import-cv", (route) => route.fulfill({ json: imported }));
      await page.getByLabel("CV PDF dosyası", { exact: true }).setInputFiles(file);
      await expect(page.getByRole("heading", { name: "Aktarmadan önce kontrol edin" })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Aktarmadan önce kontrol edin" })).toBeVisible();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      await page.getByText("Kaynak metin ve özel bölümler", { exact: true }).click();
      await expect(page.locator("pre")).toContainText("12 projeyi tamamladım.");
      await page.getByRole("button", { name: "Kontrol ettim, alanlara aktar" }).click();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Ayşe Öztürk");
      await expect(page.getByLabel("Telefon", { exact: true })).toHaveValue("");
      await page.getByRole("button", { name: "Sonraki" }).click();
      await page.reload();
      await expect(page.getByRole("heading", { name: "İş Deneyimi", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Önceki" }).click();
      await page.getByRole("button", { name: "İçe aktarmayı geri al" }).click();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Önceki Aday");
      await page.getByRole("button", { name: "Kontrol ettim, alanlara aktar" }).click();
      await page.getByLabel("Profesyonel Ünvan", { exact: true }).fill("Geliştirici");
      await page.getByLabel("Başvuracağınız pozisyon (isteğe bağlı)").fill("Kıdemli Yazılım Geliştirici");
      await page.getByRole("button", { name: "AI ile özet öner", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "AI ile CV özeti" })).toContainText("AI ile CV özeti oluşturma bağlantısı henüz yapılandırılmamış");
      await expect(page.getByLabel("Profesyonel Özet", { exact: true })).toHaveValue("Mevcut özet");
      await page.route("**/api/generate-summary", route => {
        const sent = route.request().postDataJSON();
        assert.equal(sent.cvLang, "tr"); assert.equal(sent.targetRole, "Kıdemli Yazılım Geliştirici");
        assert.equal(sent.existingSummary, "Mevcut özet");
        return route.fulfill({ json: { success: true, summary: "12 projeyi tamamlayan geliştirici.", warnings: [] } });
      });
      await page.getByRole("button", { name: "AI ile özet öner", exact: true }).click();
      await expect(page.getByRole("heading", { name: "AI önerisini inceleyin" })).toBeVisible();
      await expect(page.getByLabel("Profesyonel Özet", { exact: true })).toHaveValue("Mevcut özet");
      await page.getByLabel("AI öneri metni", { exact: true }).fill("12 projeyi tamamlayan yazılım geliştirici.");
      await page.getByRole("button", { name: "Öneriyi uygula", exact: true }).click();
      await expect(page.getByLabel("Profesyonel Özet", { exact: true })).toHaveValue("12 projeyi tamamlayan yazılım geliştirici.");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
      await page.screenshot({ path: `.agent/editor-after-${name}.png`, fullPage: true });
      await page.route("**/fonts/open-sans/*", (route) => route.fulfill({ status: 503, body: "Temporary font failure" }));
      await page.getByRole("button", { name: "Sonraki" }).click();
      await expect(page.getByLabel("Deneyim başlangıcı 1", { exact: true })).toHaveValue("2020");
      await page.getByRole("button", { name: "AI ile metin öner", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "AI ile CV düzenleme" })).toContainText("AI ile CV düzenleme bağlantısı henüz yapılandırılmamış");
      await expect(page.getByLabel("Deneyim 1 madde 1", { exact: true })).toHaveValue("12 projeyi tamamladım.");
      await page.route("**/api/enhance-cv-content", route => {
        const sent = route.request().postDataJSON();
        assert.equal(sent.cvLang, "tr"); assert.equal(sent.targetRole, "Kıdemli Yazılım Geliştirici");
        assert.equal(sent.content, "12 projeyi tamamladım.");
        return route.fulfill({ json: { success: true, enhanced: "12 projeyi başarıyla tamamladım.",
          alternatives: ["12 projenin teslimatını tamamladım."], warnings: ["Öneriyi kaynak CV ile karşılaştırın."] } });
      });
      await page.getByRole("button", { name: "AI ile metin öner", exact: true }).click();
      await expect(page.getByRole("heading", { name: "AI önerisini inceleyin" })).toBeVisible();
      await expect(page.getByLabel("Deneyim 1 madde 1", { exact: true })).toHaveValue("12 projeyi tamamladım.");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "AI review must fit mobile");
      await page.screenshot({ path: `.agent/ai-review-after-${name}.png`, fullPage: true });
      await page.getByRole("button", { name: "Öneriyi uygula", exact: true }).click();
      await expect(page.getByLabel("Deneyim 1 madde 1", { exact: true })).toHaveValue("12 projeyi başarıyla tamamladım.");
      for (let step = 0; step < 2; step++) await page.getByRole("button", { name: "Sonraki" }).click();
      await expect(page.getByLabel("Bölüm içeriği 1", { exact: true })).toHaveValue("Özgün proje açıklaması");
      await page.getByRole("button", { name: "Bölüm ekle", exact: true }).click();
      await page.getByLabel("Bölüm başlığı 2", { exact: true }).fill("Yayınlar");
      await page.getByLabel("Bölüm içeriği 2", { exact: true }).fill("Ölçüm yöntemleri çalışması.");
      await page.getByRole("button", { name: "2. bölümü yukarı taşı", exact: true }).click();
      await page.getByLabel("Bölüm başlığı 1", { exact: true }).fill("Araştırma yayınları");
      await page.reload();
      await expect(page.getByLabel("Bölüm başlığı 1", { exact: true })).toHaveValue("Araştırma yayınları");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Custom sections must fit mobile");
      await page.screenshot({ path: `.agent/sections-after-${name}.png`, fullPage: true });
      await page.getByRole("button", { name: "Sonraki" }).click();
      await expect(page.getByRole("region", { name: "PDF önizlemesi" }).getByRole("alert")).toContainText("PDF oluşturulamadı", { timeout: 20_000 });
      await page.unroute("**/fonts/open-sans/*");
      await page.getByRole("button", { name: "PDF’yi tekrar oluştur" }).click();
      await expect(page.getByRole("button", { name: "PDF Olarak İndir" })).toBeEnabled({ timeout: 20_000 });
      await page.getByRole("button", { name: "Tema Özelleştir" }).click();
      await page.getByRole("button", { name: "Lato", exact: true }).click();
      await page.getByRole("button", { name: "Varsayılana Sıfırla" }).click();
      await expect(page.getByRole("button", { name: "Open Sans", exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Lato", exact: true }).click();
      await page.getByRole("button", { name: "Yeşil renk teması" }).click();
      await page.getByRole("slider").focus();
      await page.keyboard.press("End");
      await expect(page.getByRole("slider")).toHaveValue("14");
      await expect(page.getByRole("button", { name: "PDF Olarak İndir" })).toBeEnabled({ timeout: 20_000 });
      await expect(page.getByTitle("CV PDF önizlemesi")).toBeVisible();
      await page.screenshot({ path: `.agent/preview-after-${name}.png`, fullPage: true });
      const downloadPending = page.waitForEvent("download");
      await page.getByRole("button", { name: "PDF Olarak İndir" }).click();
      const download = await downloadPending;
      const target = `.agent/imported-${name}.pdf`;
      await download.saveAs(target);
      const downloadedPDF = readFileSync(target);
      const previewBytes = await page.getByTitle("CV PDF önizlemesi").evaluate(async (frame) => {
        const response = await fetch(frame.src);
        return Array.from(new Uint8Array(await response.arrayBuffer()));
      });
      assert.deepEqual(downloadedPDF, Buffer.from(previewBytes), "Download must match the displayed PDF");
      const parser = new PDFParse({ data: new Uint8Array(downloadedPDF) });
      try {
        const { text } = await parser.getText();
        assert.ok(text.includes("AYŞE ÖZTÜRK"), "Turkish name must remain searchable in the PDF");
        assert.ok(text.includes("12 projeyi başarıyla tamamladım."), "Only approved AI edits must appear in the PDF");
        assert.ok(text.includes("Özgün proje açıklaması"), "Imported projects must be included in the PDF");
        assert.ok(text.indexOf("Ölçüm yöntemleri çalışması.") < text.indexOf("Özgün proje açıklaması"), "Custom section order must be preserved");
      } finally { await parser.destroy(); }
      const reimport = await context.request.post(`${base}/api/import-cv`, { multipart: { file: {
        name: "exported.pdf", mimeType: "application/pdf", buffer: downloadedPDF,
      } } });
      assert.equal(reimport.status(), 200, "Exported PDF must remain editable without AI keys");
      const reimported = await reimport.json();
      assert.ok(reimported.cv.customSections[0].content.includes("Özgün proje açıklaması"));
      await page.getByRole("button", { name: "Kaydet", exact: true }).click();
      await expect(page.getByText("CV başarıyla kaydedildi!", { exact: true })).toBeVisible();
      const list = await (await context.request.get(`${base}/api/my-cvs`)).json();
      assert.equal(list.createdCVs.items.find((item) => item.id === id).personalInfo.fullName, "Önceki Aday");
      const newCV = list.createdCVs.items.find((item) => item.id !== id && item.personalInfo.fullName === "Ayşe Öztürk");
      assert.ok(newCV, "Imported PDF must create a new CV");
      assert.equal(newCV.skills.languages[0].level, "");
      assert.equal(newCV.targetRole, "Kıdemli Yazılım Geliştirici");
      assert.equal(newCV.personalInfo.summary, "12 projeyi tamamlayan yazılım geliştirici.");
      assert.equal(newCV.customSections[0].title, "Araştırma yayınları");
      assert.equal(newCV.customSections[1].content, "Özgün proje açıklaması");
      assert.equal(newCV.theme.fontFamily, "Lato");
      assert.equal(newCV.theme.fontSize, 14);
      assert.equal(newCV.theme.accentColor, "#059669");
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Önceki" }).click();
      await expect(page.locator("pre")).toContainText("Özgün proje açıklaması");
      for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Sonraki" }).click();
      await page.getByRole("button", { name: "Tema Özelleştir" }).click();
      await expect(page.getByRole("button", { name: "Lato", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("slider")).toHaveValue("14");
      await page.getByRole("button", { name: "Kaydet", exact: true }).click();
      await expect(page.getByText("CV başarıyla kaydedildi!", { exact: true })).toBeVisible();
      const afterResave = await (await context.request.get(`${base}/api/my-cvs`)).json();
      assert.equal(afterResave.createdCVs.total, list.createdCVs.total, "Returning from preview must not create duplicate CVs");
      await page.evaluate((data) => sessionStorage.setItem("editCreatedCV", JSON.stringify(data)), newCV);
      await page.goto(`${base}/create-cv?edit=true`);
      await expect(page.getByRole("heading", { name: "Önizleme & İndirme", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Tema Özelleştir" }).click();
      await expect(page.getByRole("button", { name: "Lato", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("slider")).toHaveValue("14");
      const other = await context.request.post(`${base}/api/auth/register`, { data: {
        name: "Other Editor", email: `other-${name}@example.com`, password: "EditorPassword123",
      } });
      assert.equal(other.status(), 200);
      const otherToken = other.headers()["set-cookie"].split(";")[0].slice("session=".length);
      await context.addCookies([{ name: "session", value: otherToken, url: base }]);
      assert.equal((await context.request.get(`${base}/api/my-cvs/${newCV.id}`)).status(), 404);
      await page.goto(`${base}/create-cv`);
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("");
      const backup = { version: 1, snapshot: { form: { ...cv, id: newCV.id,
        personalInfo: { ...cv.personalInfo, fullName: "Yedekten Gelen Aday" } }, step: 0 } };
      await page.getByLabel("Taslak yedeği dosyası").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Yedekten Gelen Aday");
      await page.reload();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Yedekten Gelen Aday");
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); }; });
      await page.getByLabel("Ad Soyad *", { exact: true }).fill("Bellekteki Aday");
      await expect(page.getByText("Yerel taslak kaydedilemedi.", { exact: false })).toBeVisible();
      await expect(page.getByLabel("Ad Soyad *", { exact: true })).toHaveValue("Bellekteki Aday");
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
