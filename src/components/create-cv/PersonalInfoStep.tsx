"use client";

import { CVPersonalInfo } from "@/types";

interface PersonalInfoStepProps {
  data: CVPersonalInfo;
  onChange: (data: CVPersonalInfo) => void;
  onGenerateSummary: () => void;
  isGeneratingSummary: boolean;
}

export default function PersonalInfoStep({
  data,
  onChange,
  onGenerateSummary,
  isGeneratingSummary,
}: PersonalInfoStepProps) {
  const update = (field: keyof CVPersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cv-fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ad Soyad *
          </label>
          <input
            type="text"
            id="cv-fullName"
            value={data.fullName}
            required
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="örn: Ahmet Yılmaz"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="cv-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Profesyonel Ünvan
          </label>
          <input
            type="text"
            id="cv-title"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="örn: Senior Frontend Developer"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cv-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            E-posta
          </label>
          <input
            type="email"
            id="cv-email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="ornek@email.com"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="cv-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            id="cv-phone"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+90 5XX XXX XX XX"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cv-location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Konum
          </label>
          <input
            type="text"
            id="cv-location"
            value={data.location || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="örn: İstanbul, Türkiye"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="cv-linkedinUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            LinkedIn URL
          </label>
          <input
            type="url"
            id="cv-linkedinUrl"
            value={data.linkedinUrl || ""}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cv-websiteUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Web Sitesi
        </label>
        <input
          type="url"
          id="cv-websiteUrl"
          value={data.websiteUrl || ""}
          onChange={(e) => update("websiteUrl", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="cv-summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Profesyonel Özet
          </label>
          <button
            type="button"
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary || !data.fullName || !data.title}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isGeneratingSummary ? (
              <>
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Oluşturuluyor...
              </>
            ) : (
              "✨ AI ile Oluştur"
            )}
          </button>
        </div>
        <textarea
          id="cv-summary"
          value={data.summary || ""}
          onChange={(e) => update("summary", e.target.value)}
          rows={4}
          placeholder="Kendinizi kısaca tanıtın... (AI ile otomatik oluşturabilirsiniz)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
