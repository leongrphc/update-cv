import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, fileName = "optimized-cv" } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "CV içeriği gerekli" },
        { status: 400 }
      );
    }

    // Basit metin formatında döndür (gerçek PDF için @react-pdf/renderer kullanılabilir)
    // Bu endpoint client-side PDF oluşturma için veri sağlar
    return NextResponse.json({
      success: true,
      content,
      fileName: `${fileName}.pdf`,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "PDF oluşturulurken hata oluştu",
      },
      { status: 500 }
    );
  }
}
