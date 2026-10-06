"use client";

import { CVPersonalInfo } from "@/types";

interface PersonalInfoStepProps {
  data: CVPersonalInfo;
  onChange: (data: CVPersonalInfo) => void;
  summaryTools: React.ReactNode;
}

export default function PersonalInfoStep({
  data,
  onChange,
  summaryTools,
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

        </div>
        <textarea
          id="cv-summary"
          value={data.summary || ""}
          onChange={(e) => update("summary", e.target.value)}
          rows={4}
          placeholder="Kendinizi kısaca tanıtın... (AI ile otomatik oluşturabilirsiniz)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {summaryTools}
      </div>
    </div>
  );
}
