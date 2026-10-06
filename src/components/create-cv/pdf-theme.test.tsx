// @vitest-environment node
import React from "react";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import { applyPDFTheme } from "./pdf-theme";
import Classic from "./CVTemplateClassic";
import type { CreateCVFormData } from "@/types";

describe("CV theme output", () => {
  it("scales explicit child text sizes, changes accent colors and keeps the original style reusable", () => {
    const base = { page: { fontSize: 10, fontFamily: "Open Sans" }, title: { fontSize: 20, color: "#2563eb" } };
    const themed = applyPDFTheme(base, { accent: "#2563eb" }, { fontFamily: "Lato", fontSize: 12,
      primaryColor: "#123456", accentColor: "#059669" });
    expect(themed.page.fontFamily).toBe("Lato");
    expect(themed.title.fontSize).toBe(24);
    expect(themed.title.color).toBe("#059669");
    expect(base.title.fontSize).toBe(20);
  });
  it.each(["Open Sans", "Lato", "PT Serif"] as const)("embeds %s while keeping Turkish text searchable", async (fontFamily) => {
    const data: CreateCVFormData = { personalInfo: { fullName: "Ayşe Öztürk", title: "", phone: "", email: "",
      summary: "Çağrı süreçlerini ölçtüm." }, experiences: [], educations: [],
      skills: { technical: [], soft: [], languages: [], certifications: [] }, templateId: "classic",
      theme: { fontFamily, fontSize: 12, primaryColor: "#123456", accentColor: "#059669" } };
    const buffer = await renderToBuffer(<Classic data={data} />);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try { expect((await parser.getText()).text).toContain("Çağrı süreçlerini ölçtüm."); }
    finally { await parser.destroy(); }
    const name = fontFamily === "Open Sans" ? "OpenSans" : fontFamily.replaceAll(" ", "");
    expect(buffer.toString("latin1")).toContain(name);
  });
});
