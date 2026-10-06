import { z } from "zod";

export const cvEditingOptionsSchema = z.object({
  cvLang: z.enum(["tr", "en"]).default("tr"),
  targetRole: z.string().trim().max(200).optional(),
});

export type CVEditingOptions = {
  cvLang?: "tr" | "en";
  targetRole?: string;
  existingSummary?: string;
};

/** A review aid, not a verification of claims or their association with a role. */
export function numericClaimWarnings(source: string, proposals: string[], language: "tr" | "en" = "tr"): string[] {
  const numbers = (text: string) => {
    const normalized = text.normalize("NFKC");
    const values = new Set((normalized.match(/\d+(?:[.,]\d+)*/g) ?? []).map(value => value.replace(/,/g, ".")));
    // A bare value in the profile does not justify converting it into a percentage.
    for (const match of normalized.matchAll(/%\s*(\d+(?:[.,]\d+)*)|(\d+(?:[.,]\d+)*)\s*%/g)) {
      values.add(`${(match[1] ?? match[2]).replace(/,/g, ".")}%`);
    }
    return values;
  };
  const supplied = numbers(source);
  const novel = [...numbers(proposals.join("\n"))].filter(value => !supplied.has(value));
  if (!novel.length) return [];
  return [language === "en"
    ? `The suggestions contain numbers not found in the supplied profile (${novel.slice(0, 10).join(", ")}). Check them before applying. This automatic comparison does not verify the accuracy of any claim.`
    : `Önerilerde sağlanan profilde bulunmayan sayılar var (${novel.slice(0, 10).join(", ")}). Uygulamadan önce kontrol edin. Bu otomatik karşılaştırma hiçbir bilginin doğruluğunu kanıtlamaz.`];
}
