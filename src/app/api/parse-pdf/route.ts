import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, cleanExtractedText } from "@/lib/pdf-parser";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["application/pdf"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "PDF dosyası gerekli" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Sadece PDF dosyaları kabul edilir" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu 5MB'dan küçük olmalı" },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Geçersiz dosya uzantısı. Sadece .pdf kabul edilir" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate PDF magic bytes (PDF files start with %PDF-)
    const pdfMagicBytes = buffer.slice(0, 5).toString();
    if (!pdfMagicBytes.startsWith("%PDF-")) {
      return NextResponse.json(
        { success: false, error: "Geçersiz PDF dosyası" },
        { status: 400 }
      );
    }

    const rawText = await extractTextFromPDF(buffer);
    const cleanedText = cleanExtractedText(rawText);

    return NextResponse.json({
      success: true,
      text: cleanedText,
    });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "PDF işlenirken hata oluştu",
      },
      { status: 500 }
    );
  }
}
