// @vitest-environment node
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import type { CreateCVFormData } from "@/types";
// Load optimization exports first, as happens when navigating to the editor from results.
import "../PDFDownloadButton";
import Modern from "./CVTemplateModern";
import Classic from "./CVTemplateClassic";
import Creative from "./CVTemplateCreative";
import Executive from "./CVTemplateExecutive";
import Minimal from "./CVTemplateMinimal";
import Diamond from "./CVTemplateDiamond";
import { reloadPDFFonts } from "./pdf-fonts";

afterEach(() => vi.unstubAllGlobals());
const data: CreateCVFormData = {
  personalInfo: { fullName: "Ayşe Öztürk", title: "Geliştirici", email: "ayse@example.com", phone: "",
    summary: "İş süreçlerini geliştirdim. Çağrı ve ölçüm sistemleri kurdum." },
  experiences: [{ id: "experience", position: "Geliştirici", company: "Örnek", startDate: "2020",
    current: true, bullets: Array.from({ length: 60 }, (_, index) => `Kayıt ${index}: İş süreçlerinde ölçüm, geliştirme ve değerlendirme yaptım. TypeScript ile uygulamalar geliştirdim.`) }],
  educations: [], skills: { technical: ["TypeScript"], soft: [], languages: [{ id: "language", language: "İngilizce", level: "" }], certifications: [] },
  customSections: [{ id: "projects", title: "Özgün Projeler", content: "Çağrı kayıtları projesi\n12 teslimat gerçekleştirdim." }, { id: "pub", title: "Yayınlar", content: "Ölçüm yöntemleri çalışması." }],
  templateId: "classic", cvLang: "tr",
};

describe("professional PDF exports", () => {
  it.each([["modern", Modern], ["classic", Classic], ["creative", Creative],
    ["executive", Executive], ["minimal", Minimal], ["diamond", Diamond]] as const)(
    "%s embeds Turkish text and preserves long CV content across pages without network access", async (_, Template) => {
      const originalFetch = globalThis.fetch;
      const outboundRequests: string[] = [];
      vi.stubGlobal("fetch", vi.fn((input, init) => {
        if (String(input).startsWith("data:")) return originalFetch(input, init);
        outboundRequests.push(String(input));
        return Promise.reject(new Error("Network unavailable"));
      }));
      const buffer = await renderToBuffer(<Template data={data} />);
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        expect(result.total).toBeGreaterThan(1);
        const text = result.text.replace(/\s+/g, " ");
        expect(text.toLocaleLowerCase("tr")).toContain("ayşe öztürk");
        expect(text).toContain("Çağrı ve ölçüm");
        for (let index = 0; index < 60; index++) expect(text).toContain(`Kayıt ${index}:`);
        expect(text).toContain("Çağrı kayıtları projesi");
        expect(text).toContain("12 teslimat gerçekleştirdim.");
        expect(text).toContain("Ölçüm yöntemleri çalışması.");
        expect(text.indexOf("Çağrı kayıtları projesi")).toBeLessThan(text.indexOf("Ölçüm yöntemleri çalışması."));
        expect(outboundRequests).toEqual([]);
      } finally { await parser.destroy(); }
    }, 20_000);

  it("can render again after refreshing the font registry for a retry", async () => {
    reloadPDFFonts();
    const buffer = await renderToBuffer(<Classic data={{ ...data, experiences: [] }} />);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
