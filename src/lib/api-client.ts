// ============================================
// API CLIENT - Error Handling & Retry Logic
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Exponential backoff ile delay hesapla
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelay);
}

// Retry edilebilir hata mı kontrol et
function isRetryableError(status: number): boolean {
  // 429: Rate limit, 500-599: Server errors
  return status === 429 || (status >= 500 && status < 600);
}

// Genel API fetch fonksiyonu
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<ApiResponse<T>> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Retry edilebilir hata mı?
        if (isRetryableError(response.status) && attempt < config.maxRetries) {
          const delay = calculateDelay(attempt, config);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          error: data.error || getErrorMessage(response.status),
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      lastError = error as Error;

      // Network hatası - retry et
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        console.log(`Network error, retry attempt ${attempt + 1} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.",
  };
}

// HTTP status kodlarına göre hata mesajları
function getErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.",
    401: "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.",
    403: "Bu işlem için yetkiniz bulunmuyor.",
    404: "İstenen kaynak bulunamadı.",
    429: "Çok fazla istek gönderildi. Lütfen biraz bekleyin.",
    500: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    502: "Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.",
    503: "Servis geçici olarak kullanılamıyor.",
    504: "Sunucu yanıt vermedi. Lütfen tekrar deneyin.",
  };

  return messages[status] || "Beklenmeyen bir hata oluştu.";
}

// ============================================
// Typed API Functions
// ============================================

import type {
  OptimizationResult,
  CoverLetterResult,
  SkillGapAnalysis,
  JobComparisonResult,
  JobAnalysis,
} from "@/types";

export async function optimizeCV(
  cvText: string,
  jobDescription: string,
  targetRole?: string
): Promise<ApiResponse<OptimizationResult>> {
  return apiFetch<OptimizationResult>("/api/optimize", {
    method: "POST",
    body: JSON.stringify({ cvText, jobDescription, targetRole }),
  });
}

export async function generateCoverLetter(
  cvText: string,
  jobDescription: string,
  tone: "professional" | "enthusiastic" | "formal" = "professional"
): Promise<ApiResponse<CoverLetterResult>> {
  return apiFetch<CoverLetterResult>("/api/cover-letter", {
    method: "POST",
    body: JSON.stringify({ cvText, jobDescription, tone }),
  });
}

export async function analyzeSkillGaps(
  cvText: string,
  jobDescription: string
): Promise<ApiResponse<SkillGapAnalysis>> {
  return apiFetch<SkillGapAnalysis>("/api/skill-gap", {
    method: "POST",
    body: JSON.stringify({ cvText, jobDescription }),
  });
}

export async function compareJobs(
  cvText: string,
  jobs: { id: string; description: string }[]
): Promise<ApiResponse<JobComparisonResult>> {
  return apiFetch<JobComparisonResult>("/api/compare-jobs", {
    method: "POST",
    body: JSON.stringify({ cvText, jobs }),
  });
}

export async function analyzeJob(
  jobDescription: string
): Promise<ApiResponse<JobAnalysis>> {
  return apiFetch<JobAnalysis>("/api/analyze-job", {
    method: "POST",
    body: JSON.stringify({ jobDescription }),
  });
}

export async function parsePDF(file: File): Promise<ApiResponse<{ text: string }>> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/parse-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "PDF okunamadı",
      };
    }

    return {
      success: true,
      data: { text: data.text },
    };
  } catch (error) {
    return {
      success: false,
      error: "Dosya yüklenirken bir hata oluştu",
    };
  }
}
