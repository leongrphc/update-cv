import type { ATSScoreResult, ATSScoreBreakdown } from "@/types";

function turkishFold(str: string): string {
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLocaleLowerCase("tr");
}

// Sub-scorer 1: Keyword Density (0-20)
function scoreKeywords(
  cvText: string,
  matchedKeywords: string[],
  addedKeywords: string[]
): { score: number; issues: string[]; suggestions: string[] } {
  const allKeywords = [...matchedKeywords, ...addedKeywords];
  if (allKeywords.length === 0) {
    return { score: 10, issues: [], suggestions: [] };
  }

  const foldedText = turkishFold(cvText);
  let matchCount = 0;

  for (const kw of allKeywords) {
    const foldedKw = turkishFold(kw);
    if (foldedText.includes(foldedKw)) {
      matchCount++;
    }
  }

  const ratio = matchCount / allKeywords.length;
  const score = Math.round(ratio * 20);
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (score < 10) {
    issues.push("Anahtar kelime oranı düşük");
    suggestions.push("İş ilanındaki anahtar kelimeleri CV'nize ekleyin");
  }

  return { score: Math.min(20, score), issues, suggestions };
}

// Sub-scorer 2: Standard Section Headers (0-15)
function scoreSectionHeaders(cvText: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const foldedText = turkishFold(cvText);

  const headerGroups = [
    {
      patterns: ["eğitim", "education", "eğitim bilgileri", "educational background"],
      label: "Eğitim",
    },
    {
      patterns: ["deneyim", "experience", "iş deneyimi", "work experience", "profesyonel deneyim"],
      label: "Deneyim",
    },
    {
      patterns: ["beceri", "skills", "yetenekler", "teknik beceriler", "technical skills", "yetkinlikler"],
      label: "Beceri",
    },
    {
      patterns: ["özet", "summary", "profil", "profile", "hakkımda", "about", "professional summary"],
      label: "Özet",
    },
  ];

  let foundCount = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  for (const group of headerGroups) {
    const found = group.patterns.some((p) => foldedText.includes(turkishFold(p)));
    if (found) {
      foundCount++;
    } else {
      issues.push(`"${group.label}" bölümü bulunamadı`);
      suggestions.push(`CV'nize standart bir "${group.label}" bölümü ekleyin`);
    }
  }

  // Check for contact info
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cvText);
  const hasPhone = /[\+]?[\d\s\-\(\)]{7,}/.test(cvText);

  if (hasEmail) foundCount++;
  if (hasPhone) foundCount++;

  const score = Math.min(15, foundCount * 3);

  return { score, issues, suggestions };
}

// Sub-scorer 3: Bullet Points & Action Verbs (0-15)
function scoreBulletStructure(cvText: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const lines = cvText.split("\n");
  const bulletLines = lines.filter((line) => /^\s*[-*•–—]\s/.test(line));

  const actionVerbs = [
    "geliştirdim", "yönettim", "oluşturdum", "başardım", "artırdım",
    "azalttım", "tasarladım", "uyguladım", "yürüttüm", "koordine",
    "optimize", "implement", "geliştir", "yönet", "oluştur", "başar",
    "managed", "developed", "led", "implemented", "created", "improved",
    "achieved", "designed", "built", "launched", "delivered", "reduced",
    "increased", "established", "coordinated", "optimized", "streamlined",
    "spearheaded", "orchestrated", "pioneered", "transformed",
  ];

  let actionVerbCount = 0;
  const foldedText = turkishFold(cvText);

  for (const verb of actionVerbs) {
    if (foldedText.includes(turkishFold(verb))) {
      actionVerbCount++;
    }
  }

  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Bullet points score (up to 8)
  if (bulletLines.length >= 5) {
    score += 8;
  } else if (bulletLines.length >= 3) {
    score += 6;
  } else if (bulletLines.length >= 1) {
    score += 3;
    issues.push("Yetersiz madde işareti sayısı");
    suggestions.push("Deneyimlerinizi madde işareti ile listelemeye çalışın");
  } else {
    issues.push("Hiç madde işareti bulunamadı");
    suggestions.push("Deneyimlerinizi '- ' ile başlayan maddeler halinde yazın");
  }

  // Action verbs score (up to 7)
  if (actionVerbCount >= 5) {
    score += 7;
  } else if (actionVerbCount >= 3) {
    score += 5;
  } else if (actionVerbCount >= 1) {
    score += 3;
    suggestions.push("Maddelerinize fiil ile başlayın (örn: geliştirdim, yönettim)");
  } else {
    issues.push("Eylem fiili kullanılmamış");
    suggestions.push("Her maddeye bir eylem fiili ile başlayın");
  }

  return { score: Math.min(15, score), issues, suggestions };
}

// Sub-scorer 4: Quantified Results (0-15)
function scoreQuantifiedResults(cvText: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const patterns = [
    /%\d+/g,
    /\d+%/g,
    /\d+\+/g,
    /[\$€₺£]\s*\d+/g,
    /\d{1,3}[\.,]\d{3}/g,
    /\d+\s*-\s*\d+/g,
    /\d+\s*(yıl|ay|sene|year|month|gün|day)/gi,
    /\d+\s*(kişi|person|takım|team|proje|project)/gi,
  ];

  let count = 0;
  for (const pattern of patterns) {
    const matches = cvText.match(pattern);
    if (matches) count += matches.length;
  }

  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (count >= 5) {
    score = 15;
  } else if (count >= 3) {
    score = 12;
  } else if (count >= 1) {
    score = 7;
    issues.push("Sayısal sonuçlar yetersiz");
    suggestions.push("Deneyimlerinize ölçülebilir sonuçlar ekleyin (örn: %20 artış)");
  } else {
    score = 2;
    issues.push("Hiç sayısal sonuç yok");
    suggestions.push("Başarılarınızı sayılarla ifade edin (%, para birimi, süre)");
  }

  return { score, issues, suggestions };
}

// Sub-scorer 5: CV Length (0-15)
function scoreLength(cvText: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const wordCount = cvText.split(/\s+/).filter((w) => w.length > 0).length;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (wordCount >= 300 && wordCount <= 600) {
    return { score: 15, issues, suggestions };
  }

  if (wordCount >= 200 && wordCount < 300) {
    issues.push("CV biraz kısa");
    suggestions.push("Deneyim ve becerilerinizi daha detaylı açıklayın");
    return { score: 10, issues, suggestions };
  }

  if (wordCount > 600 && wordCount <= 800) {
    issues.push("CV biraz uzun");
    suggestions.push("Önemli olmayan detayları kaldırarak CV'nizi kısaltın");
    return { score: 10, issues, suggestions };
  }

  if (wordCount > 800) {
    issues.push("CV çok uzun");
    suggestions.push("CV'nizi 1 sayfaya sığacak şekilde kısaltın (ideal: 300-600 kelime)");
    return { score: 5, issues, suggestions };
  }

  if (wordCount < 100) {
    issues.push("CV çok kısa");
    suggestions.push("Deneyim, eğitim ve becerilerinizi detaylandırın");
    return { score: 0, issues, suggestions };
  }

  issues.push("CV kısa");
  suggestions.push("İçeriği zenginleştirin, ideal CV 300-600 kelimedir");
  return { score: 5, issues, suggestions };
}

// Sub-scorer 6: Formatting (0-20)
function scoreFormatting(cvText: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  let score = 20;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Deduct for HTML tags
  const htmlTags = cvText.match(/<\/?(table|img|div|span|p|br|hr|iframe)[^>]*>/gi);
  if (htmlTags) {
    const deduction = Math.min(10, htmlTags.length * 5);
    score -= deduction;
    issues.push("HTML etiketleri tespit edildi");
    suggestions.push("CV'nizden HTML etiketlerini kaldırın, düz metin kullanın");
  }

  // Deduct for excessive blank lines
  const excessiveBlanks = cvText.match(/\n{4,}/g);
  if (excessiveBlanks) {
    score -= 3;
    issues.push("Aşırı boş satır tespit edildi");
    suggestions.push("Fazla boş satırları kaldırın");
  }

  // Deduct for ALL CAPS paragraphs
  const lines = cvText.split("\n");
  const allCapsLines = lines.filter(
    (line) => line.length > 50 && line === line.toLocaleUpperCase("tr") && /[A-ZÇĞİÖŞÜ]/.test(line)
  );
  if (allCapsLines.length > 2) {
    score -= 3;
    issues.push("Büyük harf blokları tespit edildi");
    suggestions.push("Tamamı büyük harf olan uzun satırlardan kaçının");
  }

  // Award for consistent date patterns
  const datePatterns = cvText.match(/\b(20\d{2}|19\d{2})\b/g);
  if (datePatterns && datePatterns.length >= 2) {
    score += 0; // No extra points, just no deduction
  }

  // Award for proper line breaks between sections
  const sectionBreaks = cvText.match(/\n\s*\n/g);
  if (sectionBreaks && sectionBreaks.length >= 2) {
    score += 0; // No extra points, just no deduction
  }

  return { score: Math.max(0, Math.min(20, score)), issues, suggestions };
}

export function scoreCV(
  cvText: string,
  options?: {
    matchedKeywords?: string[];
    addedKeywords?: string[];
  }
): ATSScoreResult {
  const kw = scoreKeywords(
    cvText,
    options?.matchedKeywords || [],
    options?.addedKeywords || []
  );
  const headers = scoreSectionHeaders(cvText);
  const bullets = scoreBulletStructure(cvText);
  const quantified = scoreQuantifiedResults(cvText);
  const length = scoreLength(cvText);
  const formatting = scoreFormatting(cvText);

  const breakdown: ATSScoreBreakdown = {
    keywordScore: kw.score,
    sectionHeaderScore: headers.score,
    bulletStructureScore: bullets.score,
    quantifiedResultsScore: quantified.score,
    lengthScore: length.score,
    formattingScore: formatting.score,
  };

  const total = Object.values(breakdown).reduce((sum, s) => sum + s, 0);

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown,
    issues: [...kw.issues, ...headers.issues, ...bullets.issues, ...quantified.issues, ...length.issues, ...formatting.issues],
    suggestions: [...kw.suggestions, ...headers.suggestions, ...bullets.suggestions, ...quantified.suggestions, ...length.suggestions, ...formatting.suggestions],
  };
}
