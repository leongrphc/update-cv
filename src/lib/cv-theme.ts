import { z } from "zod";
import type { CVTemplateTheme, PDFTemplateId } from "@/types";

export const cvThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontFamily: z.enum(["Open Sans", "Lato", "PT Serif"]),
  fontSize: z.number().min(8).max(14).multipleOf(0.5),
});

const palettes: Record<PDFTemplateId, [string, string, number]> = {
  modern: ["#1a1a1a", "#2563eb", 10], classic: ["#1a1a1a", "#1e40af", 10],
  creative: ["#1e293b", "#3b82f6", 10], executive: ["#0f172a", "#d4a853", 10],
  minimal: ["#000000", "#000000", 9.5], diamond: ["#064e3b", "#064e3b", 10],
};
export function defaultTemplateTheme(templateId: PDFTemplateId): CVTemplateTheme {
  const [primaryColor, accentColor, fontSize] = palettes[templateId];
  return { primaryColor, accentColor, fontSize, fontFamily: "Open Sans" };
}
