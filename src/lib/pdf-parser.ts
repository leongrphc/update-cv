async function getPDFParser() {
  if (process.env.PRISMA_DATABASE_PROVIDER === "d1") {
    // Workers do not provide native canvas or spawn PDF.js's Node worker.
    // Text extraction needs only its matrix shim and an in-process worker.
    const globals = globalThis as typeof globalThis & { pdfjsWorker?: unknown };
    if (!globals.DOMMatrix) {
      const { default: DOMMatrix } = await import("@thednp/dommatrix");
      globals.DOMMatrix = DOMMatrix as unknown as typeof globalThis.DOMMatrix;
    }
    if (!globals.pdfjsWorker) {
      globals.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    }
  }
  return (await import("pdf-parse")).PDFParse;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const PDFParse = await getPDFParser();
  const parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
  try {
    const data = await parser.getText({ pageJoiner: "\n\n" });
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.");
  } finally {
    await parser.destroy();
  }
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ") // Satır sonlarını koruyarak yatay boşlukları temizle
    .replace(/\n{3,}/g, "\n\n") // Çoklu satır sonlarını azalt
    .trim();
}
