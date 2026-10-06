import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";

const directory = mkdtempSync(join(tmpdir(), "update-cv-smoke-"));
const database = `file:${join(directory, "smoke.db").replaceAll("\\", "/")}`;
const env = { ...process.env, NODE_ENV: "production", DATABASE_URL: database,
  JWT_SECRET: randomBytes(32).toString("hex"), NEXT_TELEMETRY_DISABLED: "1" };
let server;
let output = "";

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
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; }
    } catch { /* Startup in progress. */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.ok(ready, "Application did not start");

  const post = (path, body, cookie) => fetch(`${base}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  });
  const register = async (name) => {
    const response = await post("/api/auth/register", { email: `${name}@example.com`, password: "SmokePassword123", name });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie, "Missing session cookie");
    return cookie;
  };
  const cookie = await register("smoke-owner");
  const cv = {
    personalInfo: { fullName: "Smoke CV Owner", title: "Developer", email: "smoke-owner@example.com", phone: "123",
      summary: "Original summary", location: "Ankara", linkedinUrl: "https://linkedin.com/in/test", websiteUrl: "https://example.com" },
    experiences: [{ id: "exp", company: "Example", position: "Developer", startDate: "2020-01", current: true, bullets: ["Built software"] }],
    educations: [{ id: "edu", school: "University", field: "Computer Science", startDate: "2015", endDate: "2019", gpa: "3.5" }],
    skills: { technical: ["TypeScript"], soft: ["Communication"], languages: [{ id: "lang", language: "English", level: "C1" }],
      certifications: [{ id: "cert", name: "Certificate", issuer: "Example", date: "2024" }] },
    templateId: "modern", cvLang: "en",
  };
  let response = await post("/api/save-cv", cv, cookie);
  assert.equal(response.status, 200);
  const { id } = await response.json();
  const list = async () => {
    const response = await fetch(`${base}/api/my-cvs`, { headers: { cookie } });
    assert.equal(response.status, 200);
    return (await response.json()).createdCVs;
  };
  let saved = await list();
  assert.equal(saved.total, 1);
  for (const key of ["personalInfo", "experiences", "educations", "skills", "cvLang"]) assert.deepEqual(saved.items[0][key], cv[key]);
  cv.personalInfo.summary = "Updated summary";
  response = await post("/api/save-cv", { ...cv, id }, cookie);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, id);
  saved = await list();
  assert.equal(saved.total, 1, "Editing must not create duplicates");
  assert.equal(saved.items[0].personalInfo.summary, "Updated summary");

  const otherCookie = await register("smoke-other");
  assert.equal((await post("/api/save-cv", { ...cv, id }, otherCookie)).status, 404);
  assert.equal((await post("/api/share-cv", { cvId: id, action: "enable" }, otherCookie)).status, 404);
  assert.equal((await post("/api/chat", { messages: [{ role: "user", content: "Help" }] })).status, 401);

  response = await post("/api/share-cv", { cvId: id, action: "enable" }, cookie);
  assert.equal(response.status, 200);
  const { shareToken } = await response.json();
  assert.ok(shareToken);
  const publicPage = await (await fetch(`${base}/share/${shareToken}`)).text();
  assert.ok(publicPage.includes("Smoke CV Owner") && publicPage.includes("Updated summary"));
  assert.ok(publicPage.includes("Professional Summary"));
  assert.equal((await post("/api/share-cv", { cvId: id, action: "disable" }, cookie)).status, 200);
  const disabledPage = await (await fetch(`${base}/share/${shareToken}`)).text();
  assert.ok(!disabledPage.includes("Smoke CV Owner"), "Disabled share must not expose the CV");
  console.log("Application smoke checks passed: CV round-trip, updates, language, ownership, sharing, and API authentication");
} finally {
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
  }
  for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
  rmdirSync(directory);
}
