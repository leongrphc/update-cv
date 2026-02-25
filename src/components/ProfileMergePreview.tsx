"use client";

import { useState } from "react";
import { LinkedInProfile, LinkedInMergeResult } from "@/types";

interface ProfileMergePreviewProps {
  cvText: string;
  linkedInProfile: LinkedInProfile;
  onMerge: (result: LinkedInMergeResult) => void;
  onCancel: () => void;
}

export default function ProfileMergePreview({
  cvText,
  linkedInProfile,
  onMerge,
  onCancel,
}: ProfileMergePreviewProps) {
  const [priority, setPriority] = useState<"cv" | "linkedin" | "balanced">("balanced");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/linkedin/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          linkedInProfile,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Birleştirme hatası");
      }

      const result = await response.json();
      onMerge(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* LinkedIn Profile Preview */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          LinkedIn Profili Önizleme
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {linkedInProfile.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {linkedInProfile.fullName}
              </h4>
              {linkedInProfile.headline && (
                <p className="text-slate-600 dark:text-slate-400">
                  {linkedInProfile.headline}
                </p>
              )}
              {linkedInProfile.location && (
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {linkedInProfile.location}
                </p>
              )}
            </div>
          </div>

          {linkedInProfile.summary && (
            <div>
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Özet
              </h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {linkedInProfile.summary}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Deneyim ({linkedInProfile.experience.length})
              </h5>
              {linkedInProfile.experience.slice(0, 2).map((exp, i) => (
                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <span className="font-medium">{exp.title}</span>
                  <br />
                  <span className="text-slate-500">{exp.company}</span>
                </div>
              ))}
              {linkedInProfile.experience.length > 2 && (
                <p className="text-xs text-slate-500">
                  +{linkedInProfile.experience.length - 2} daha
                </p>
              )}
            </div>

            <div>
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Eğitim ({linkedInProfile.education.length})
              </h5>
              {linkedInProfile.education.slice(0, 2).map((edu, i) => (
                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  {edu.school}
                </div>
              ))}
            </div>

            <div>
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Beceriler ({linkedInProfile.skills.length})
              </h5>
              <div className="flex flex-wrap gap-1">
                {linkedInProfile.skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-sm"
                  >
                    {skill}
                  </span>
                ))}
                {linkedInProfile.skills.length > 5 && (
                  <span className="text-xs text-slate-500">
                    +{linkedInProfile.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Selection */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Birleştirme Önceliği
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="radio"
              name="priority"
              value="balanced"
              checked={priority === "balanced"}
              onChange={(e) => setPriority(e.target.value as "balanced")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Dengeli (Önerilen)
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Her iki kaynaktan en iyi bilgileri alır, detaylı olanı tercih eder
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="radio"
              name="priority"
              value="cv"
              checked={priority === "cv"}
              onChange={(e) => setPriority(e.target.value as "cv")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                CV Öncelikli
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mevcut CV korunur, sadece eksik bilgiler LinkedIn&apos;den eklenir
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="radio"
              name="priority"
              value="linkedin"
              checked={priority === "linkedin"}
              onChange={(e) => setPriority(e.target.value as "linkedin")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                LinkedIn Öncelikli
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                LinkedIn bilgileri öncelikli, daha güncel olduğu varsayılır
              </p>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors disabled:opacity-50"
        >
          İptal
        </button>
        <button
          onClick={handleMerge}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading && (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          )}
          Profilleri Birleştir
        </button>
      </div>
    </div>
  );
}
