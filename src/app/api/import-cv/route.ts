import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { extractEditableCV } from "@/lib/llm-client";
import { prepareImportedCV, prepareManualCV } from "@/lib/cv-import";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!await getSession()) {
    return NextResponse.json({ success: false, error: "CV aktarmak için giriş yapın." }, { status: 401 });
  }
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!file || typeof file === "string" || file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ success: false, error: "Geçerli bir PDF dosyası seçin." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "PDF dosyası en fazla 5 MB olabilir." }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString() !== "%PDF-") {
      return NextResponse.json({ success: false, error: "Dosya geçerli bir PDF değil." }, { status: 400 });
    }
    let sourceText: string;
    try {
      sourceText = (await extractTextFromPDF(buffer)).replace(/\r\n?/g, "\n").trim();
    } catch {
      return NextResponse.json({ success: false, error: "PDF okunamadı. Şifre korumasını kaldırıp tekrar yükleyin veya başka bir PDF seçin." }, { status: 422 });
    }
    if (sourceText.length < 20) {
      return NextResponse.json({ success: false, error: "PDF'de yeterli seçilebilir metin bulunamadı. Taranmış belgeler için önce OCR uygulayın; bu sürüm görsellerden metin okuyamıyor." }, { status: 422 });
    }
    if (sourceText.length > 50_000) {
      return NextResponse.json({ success: false, error: "PDF metni çok uzun. Yalnızca CV sayfalarını içeren bir dosya yükleyin." }, { status: 413 });
    }
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ success: true, ...prepareManualCV(sourceText), sourceText });
    }
    const result = prepareImportedCV(await extractEditableCV(sourceText));
    return NextResponse.json({ success: true, ...result, sourceText });
  } catch (error) {
    console.error("CV import failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ success: false, error: "CV alanları çıkarılamadı. Tekrar deneyin; mevcut düzenlemeleriniz korunuyor." }, { status: 502 });
  }
}
