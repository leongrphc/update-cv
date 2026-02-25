import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.");
  }
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Çoklu boşlukları tek boşluğa çevir
    .replace(/\n{3,}/g, "\n\n") // Çoklu satır sonlarını azalt
    .trim();
}
