import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
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
