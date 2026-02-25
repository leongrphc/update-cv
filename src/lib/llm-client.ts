import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import {
  CV_OPTIMIZER_SYSTEM_PROMPT,
  JOB_ANALYSIS_PROMPT,
  COVER_LETTER_PROMPT,
  SKILL_GAP_PROMPT,
  JOB_COMPARISON_PROMPT,
  INTERVIEW_GENERATE_PROMPT,
  INTERVIEW_EVALUATE_PROMPT,
  LINKEDIN_PARSE_PROMPT,
  LINKEDIN_MERGE_PROMPT,
  CV_ENHANCE_PROMPT,
  CV_SUMMARY_PROMPT,
  buildOptimizationPrompt,
  RE_ENHANCE_PROMPTS,
} from "./prompts";
import type { OptimizationOptions, EnhanceType } from "@/types";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export type LLMProvider = "openai" | "google";

function getModel(provider: LLMProvider = "google") {
  return provider === "openai"
    ? openai("gpt-4-turbo-preview")
    : google("models/gemini-2.5-flash");
}

function getProvider(): LLMProvider {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "google" : "openai";
}

// ============================================
// CV OPTIMIZATION
// ============================================

const cvOptimizationSchema = z.object({
  optimizedCV: z.string().describe("The full text of the optimized CV"),
  targetRole: z.string().describe("The target position title"),
  improvements: z
    .array(z.string())
    .describe("List of 3-5 key improvements made"),
  roleAdaptations: z
    .array(z.string())
    .describe("2-3 ways CV was adapted for the target role"),
  keywords: z.object({
    matched: z.array(z.string()).describe("5-8 matched keywords"),
    added: z.array(z.string()).describe("5-8 added keywords"),
    missing: z.array(z.string()).describe("5-8 missing keywords"),
  }),
  atsScore: z.object({
    before: z.number(),
    after: z.number(),
  }),
  skillGaps: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(["critical", "important", "nice-to-have"]),
        suggestion: z.string().describe("Brief suggestion, max 100 chars"),
      }),
    )
    .describe("Top 3-5 skill gaps"),
  proTips: z
    .array(
      z.object({
        category: z.enum(["interview", "networking", "application", "skills"]),
        tip: z.string().describe("A useful pro tip for the candidate"),
      }),
    )
    .optional()
    .describe("3-4 pro tips for the candidate"),
});

export type CVOptimizationResult = z.infer<typeof cvOptimizationSchema>;

export async function optimizeCV(
  cvText: string,
  jobDescription: string,
  targetRole?: string,
  options?: OptimizationOptions,
): Promise<CVOptimizationResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const systemPrompt = options
    ? buildOptimizationPrompt(options)
    : CV_OPTIMIZER_SYSTEM_PROMPT;

  const userPrompt = `
## Mevcut CV:
${cvText}

## İş İlanı:
${jobDescription}

${targetRole ? `## Hedef Pozisyon: ${targetRole}\nCV'yi bu pozisyona göre uyarla.` : ""}

Lütfen bu CV'yi yukarıdaki iş ilanına göre optimize et.

KRİTİK: CV çıktısı MUTLAKA tek A4 sayfasına sığacak uzunlukta olmalıdır (yaklaşık 400-500 kelime). Kısa, öz ve etkili yaz. Her kelime değer katmalı.

ÖNEMLİ KISITLAMALAR:
- improvements: Sadece 3-5 madde
- roleAdaptations: Sadece 2-3 madde
- keywords (matched/added/missing): Her biri max 8 madde
- skillGaps: Max 5 madde, her suggestion max 100 karakter
- proTips: 3-4 adet faydalı ipucu ekle
- optimizedCV: Tek sayfaya sığacak uzunlukta, maksimum 500 kelime`;

  const { object } = await generateObject({
    model,
    schema: cvOptimizationSchema,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// RE-ENHANCE CV
// ============================================

const reEnhanceSchema = z.object({
  enhancedCV: z.string().describe("The full text of the re-enhanced CV"),
  changes: z.array(z.string()).describe("List of changes made"),
});

export type ReEnhanceResult = z.infer<typeof reEnhanceSchema>;

export async function reEnhanceCV(
  optimizedCV: string,
  jobDescription: string,
  enhanceType: EnhanceType,
  targetRole?: string,
): Promise<ReEnhanceResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const systemPrompt = RE_ENHANCE_PROMPTS[enhanceType];

  const { object } = await generateObject({
    model,
    schema: reEnhanceSchema,
    system: systemPrompt,
    prompt: `
## Optimize Edilmiş CV:
${optimizedCV}

## İş İlanı:
${jobDescription}

${targetRole ? `## Hedef Pozisyon: ${targetRole}` : ""}

Bu CV'yi "${enhanceType}" odağında güçlendir.

KRİTİK: CV çıktısı MUTLAKA tek A4 sayfasına sığacak uzunlukta olmalıdır (yaklaşık 400-500 kelime). İçerik eklerken CV'yi uzatma, mevcut içeriği daha etkili hale getir.`,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// JOB ANALYSIS
// ============================================

const jobAnalysisSchema = z.object({
  title: z.string(),
  company: z.string().optional(),
  industry: z.string(),
  experienceLevel: z.enum(["Junior", "Mid", "Senior", "Lead"]),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  benefits: z.array(z.string()).optional(),
  redFlags: z.array(z.string()).optional(),
  applicationTips: z.array(z.string()),
});

export type JobAnalysisResult = z.infer<typeof jobAnalysisSchema>;

export async function analyzeJob(
  jobDescription: string,
): Promise<JobAnalysisResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: jobAnalysisSchema,
    system: JOB_ANALYSIS_PROMPT,
    prompt: `İş İlanı:\n${jobDescription}`,
    temperature: 0.2,
  });

  return object;
}

// ============================================
// COVER LETTER GENERATION
// ============================================

const coverLetterSchema = z.object({
  coverLetter: z.string(),
  highlights: z.array(z.string()),
  callToAction: z.string(),
});

export type CoverLetterResult = z.infer<typeof coverLetterSchema>;

export async function generateCoverLetter(
  cvText: string,
  jobDescription: string,
  tone: "professional" | "enthusiastic" | "formal" = "professional",
): Promise<CoverLetterResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: coverLetterSchema,
    system: COVER_LETTER_PROMPT,
    prompt: `
## CV:
${cvText}

## İş İlanı:
${jobDescription}

## İstenen Ton: ${tone}

Bu bilgilere göre ön yazı oluştur.`,
    temperature: 0.4,
  });

  return object;
}

// ============================================
// SKILL GAP ANALYSIS
// ============================================

const skillGapSchema = z.object({
  gaps: z.array(
    z.object({
      skill: z.string(),
      category: z.enum(["technical", "soft", "certification", "domain"]),
      importance: z.enum(["critical", "important", "nice-to-have"]),
      currentLevel: z.enum(["none", "beginner", "intermediate", "advanced"]),
      requiredLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      learningPath: z.object({
        resources: z.array(z.string()),
        courses: z.array(z.string()),
        certifications: z.array(z.string()),
        estimatedTime: z.string(),
      }),
      workaround: z.string(),
    }),
  ),
  overallReadiness: z.number(),
  strongPoints: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type SkillGapResult = z.infer<typeof skillGapSchema>;

export async function analyzeSkillGaps(
  cvText: string,
  jobDescription: string,
): Promise<SkillGapResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: skillGapSchema,
    system: SKILL_GAP_PROMPT,
    prompt: `
## CV:
${cvText}

## Hedef İş İlanı:
${jobDescription}

Beceri açığını analiz et.`,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// MULTI-JOB COMPARISON
// ============================================

const jobComparisonSchema = z.object({
  comparisons: z.array(
    z.object({
      jobId: z.string(),
      title: z.string(),
      company: z.string().optional(),
      matchScore: z.number(),
      strengths: z.array(z.string()),
      gaps: z.array(z.string()),
      effort: z.enum(["low", "medium", "high"]),
      recommendation: z.string(),
    }),
  ),
  bestMatch: z.string(),
  overallStrategy: z.string(),
});

export type JobComparisonResult = z.infer<typeof jobComparisonSchema>;

export async function compareJobs(
  cvText: string,
  jobs: { id: string; description: string }[],
): Promise<JobComparisonResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const jobsText = jobs
    .map((job, i) => `### İlan ${i + 1} (ID: ${job.id}):\n${job.description}`)
    .join("\n\n");

  const { object } = await generateObject({
    model,
    schema: jobComparisonSchema,
    system: JOB_COMPARISON_PROMPT,
    prompt: `
## CV:
${cvText}

## İş İlanları:
${jobsText}

Bu ilanları karşılaştır ve en uygun olanı belirle.`,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// AI INTERVIEW SIMULATION
// ============================================

const interviewQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      questionNumber: z.number(),
      questionType: z.enum([
        "technical",
        "behavioral",
        "situational",
        "competency",
      ]),
      question: z.string(),
      expectedTopics: z.array(z.string()),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ),
  targetRole: z.string(),
});

export type InterviewQuestionsResult = z.infer<typeof interviewQuestionsSchema>;

export async function generateInterviewQuestions(
  cvText: string,
  jobDescription: string,
  targetRole?: string,
  questionCount: number = 5,
): Promise<InterviewQuestionsResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: interviewQuestionsSchema,
    system: INTERVIEW_GENERATE_PROMPT,
    prompt: `
## CV:
${cvText}

## İş İlanı:
${jobDescription}

${targetRole ? `## Hedef Pozisyon: ${targetRole}` : ""}

Lütfen ${questionCount} adet mülakat sorusu hazırla. Soruların türlerini ve zorluk seviyelerini dengeli dağıt.`,
    temperature: 0.4,
  });

  return object;
}

const interviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  sampleAnswer: z.string(),
});

export type InterviewEvaluationResult = z.infer<
  typeof interviewEvaluationSchema
>;

export async function evaluateInterviewAnswer(
  question: string,
  expectedTopics: string[],
  answer: string,
  cvText: string,
  jobDescription: string,
): Promise<InterviewEvaluationResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: interviewEvaluationSchema,
    system: INTERVIEW_EVALUATE_PROMPT,
    prompt: `
## Soru:
${question}

## Beklenen Konular:
${expectedTopics.join(", ")}

## Adayın CV'si:
${cvText}

## İş İlanı:
${jobDescription}

## Adayın Cevabı:
${answer}

Bu cevabı değerlendir.`,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// LINKEDIN PROFILE INTEGRATION
// ============================================

const linkedInProfileSchema = z.object({
  fullName: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean(),
      description: z.string().optional(),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
  skills: z.array(z.string()),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
        credentialId: z.string().optional(),
      }),
    )
    .optional(),
  languages: z
    .array(
      z.object({
        language: z.string(),
        proficiency: z.enum([
          "elementary",
          "limited",
          "professional",
          "full",
          "native",
        ]),
      }),
    )
    .optional(),
  extractedSections: z.array(z.string()),
});

export type LinkedInProfileResult = z.infer<typeof linkedInProfileSchema>;

export async function parseLinkedInProfile(
  pdfText: string,
): Promise<LinkedInProfileResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: linkedInProfileSchema,
    system: LINKEDIN_PARSE_PROMPT,
    prompt: `
## LinkedIn PDF İçeriği:
${pdfText}

Bu profil verilerini yapılandırılmış formata çevir.`,
    temperature: 0.2,
  });

  return object;
}

const linkedInMergeSchema = z.object({
  mergedCV: z.string(),
  addedFromLinkedIn: z.array(z.string()),
  enhancedSections: z.array(z.string()),
  conflicts: z.array(
    z.object({
      section: z.string(),
      cvValue: z.string(),
      linkedInValue: z.string(),
      resolution: z.string(),
    }),
  ),
});

export type LinkedInMergeResult = z.infer<typeof linkedInMergeSchema>;

export async function mergeProfiles(
  cvText: string,
  linkedInProfile: LinkedInProfileResult,
  priority: "cv" | "linkedin" | "balanced" = "balanced",
): Promise<LinkedInMergeResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: linkedInMergeSchema,
    system: LINKEDIN_MERGE_PROMPT,
    prompt: `
## Mevcut CV:
${cvText}

## LinkedIn Profili:
${JSON.stringify(linkedInProfile, null, 2)}

## Birleştirme Önceliği: ${priority}

Bu iki kaynağı birleştirerek zenginleştirilmiş bir CV oluştur.`,
    temperature: 0.3,
  });

  return object;
}

// ============================================
// CV CREATION - ENHANCE & SUMMARY
// ============================================

const cvEnhanceSchema = z.object({
  enhanced: z.string().describe("The enhanced/improved content"),
  alternatives: z
    .array(z.string())
    .describe("2 alternative versions of the enhanced content"),
});

export type CVEnhanceResult = z.infer<typeof cvEnhanceSchema>;

export async function enhanceCVContent(
  content: string,
  contentType: "bullet" | "summary" | "title",
  context?: string,
): Promise<CVEnhanceResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: cvEnhanceSchema,
    system: CV_ENHANCE_PROMPT,
    prompt: `
## İçerik Türü: ${contentType}
## Mevcut İçerik:
${content}

${context ? `## Bağlam: ${context}` : ""}

Bu içeriği güçlendir. 1 ana güçlendirilmiş versiyon ve 2 alternatif sun.`,
    temperature: 0.3,
  });

  return object;
}

const cvSummarySchema = z.object({
  summary: z.string().describe("Professional summary in Turkish, 3-4 sentences"),
  keywords: z
    .array(z.string())
    .describe("5-8 ATS keywords extracted from the profile"),
});

export type CVSummaryResult = z.infer<typeof cvSummarySchema>;

export async function generateCVSummary(
  personalInfo: { fullName: string; title: string },
  experiences: { position: string; company: string; bullets: string[] }[],
  skills: { technical: string[]; soft: string[] },
): Promise<CVSummaryResult> {
  const provider = getProvider();
  const model = getModel(provider);

  const expText = experiences
    .map(
      (e) =>
        `${e.position} @ ${e.company}: ${e.bullets.filter(Boolean).join("; ")}`,
    )
    .join("\n");

  const { object } = await generateObject({
    model,
    schema: cvSummarySchema,
    system: CV_SUMMARY_PROMPT,
    prompt: `
## Kişisel Bilgiler:
Ad: ${personalInfo.fullName}
Ünvan: ${personalInfo.title}

## Deneyimler:
${expText || "Henüz deneyim girilmemiş"}

## Beceriler:
Teknik: ${skills.technical.join(", ") || "Belirtilmemiş"}
Kişisel: ${skills.soft.join(", ") || "Belirtilmemiş"}

Bu bilgilere göre profesyonel bir CV özeti oluştur.`,
    temperature: 0.3,
  });

  return object;
}
