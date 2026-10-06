"use client";
import AIContentReview from "./AIContentReview";

interface Props {
  content: string; contentType: "bullet" | "summary" | "title"; context?: string;
  cvLang?: "tr" | "en"; targetRole?: string; onEnhanced: (text: string) => void; disabled?: boolean;
}
export default function AIEnhanceButton({ content, contentType, context, cvLang = "tr", targetRole, onEnhanced, disabled }: Props) {
  return <AIContentReview content={content} requestBody={{ content, contentType, context, cvLang, targetRole }}
    endpoint="/api/enhance-cv-content" label="AI ile metin öner" onApply={onEnhanced} disabled={disabled || !content.trim()} />;
}
