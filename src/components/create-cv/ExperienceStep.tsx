"use client";

import { CVExperienceEntry } from "@/types";
import AIEnhanceButton from "./AIEnhanceButton";

interface ExperienceStepProps {
  data: CVExperienceEntry[];
  onChange: (data: CVExperienceEntry[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function ExperienceStep({ data, onChange }: ExperienceStepProps) {
  const addExperience = () => {
    onChange([
      ...data,
      {
        id: generateId(),
        position: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [""],
      },
    ]);
  };

  const removeExperience = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateExperience = (
    index: number,
    field: keyof CVExperienceEntry,
    value: string | boolean | string[]
  ) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "current" && value === true) {
      updated[index].endDate = "";
    }
    onChange(updated);
  };

  const addBullet = (expIndex: number) => {
    const updated = [...data];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: [...updated[expIndex].bullets, ""],
    };
    onChange(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...data];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: updated[expIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
    onChange(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...data];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    onChange(updated);
  };

  const handleEnhanced = (expIndex: number, bulletIndex: number, enhanced: string) => {
    updateBullet(expIndex, bulletIndex, enhanced);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          İş deneyimlerinizi en güncel olandan başlayarak ekleyin.
        </p>
        <button
          type="button"
          onClick={addExperience}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          + Deneyim Ekle
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm">
          <p className="text-slate-500 dark:text-slate-400 mb-3">
            Henüz deneyim eklenmedi
          </p>
          <button
            type="button"
            onClick={addExperience}
            className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors text-sm"
          >
            İlk Deneyimi Ekle
          </button>
        </div>
      )}

      {data.map((exp, expIndex) => (
        <div
          key={exp.id}
          className="p-5 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Deneyim {expIndex + 1}
            </span>
            {data.length > 0 && (
              <button
                type="button"
                onClick={() => removeExperience(expIndex)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Kaldır
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pozisyon *
              </label>
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateExperience(expIndex, "position", e.target.value)}
                placeholder="örn: Frontend Developer"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Şirket *
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(expIndex, "company", e.target.value)}
                placeholder="örn: ABC Teknoloji"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Konum
              </label>
              <input
                type="text"
                value={exp.location || ""}
                onChange={(e) => updateExperience(expIndex, "location", e.target.value)}
                placeholder="örn: İstanbul"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Başlangıç *
              </label>
              <input
                type="month"
                value={exp.startDate}
                onChange={(e) => updateExperience(expIndex, "startDate", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bitiş
              </label>
              <div className="space-y-2">
                <input
                  type="month"
                  value={exp.endDate || ""}
                  onChange={(e) => updateExperience(expIndex, "endDate", e.target.value)}
                  disabled={exp.current}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(expIndex, "current", e.target.checked)}
                    className="rounded-sm"
                  />
                  Devam ediyor
                </label>
              </div>
            </div>
          </div>

          {/* Bullets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Başarılar & Sorumluluklar
              </label>
              <button
                type="button"
                onClick={() => addBullet(expIndex)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Madde Ekle
              </button>
            </div>
            <div className="space-y-2">
              {exp.bullets.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="flex items-start gap-2">
                  <span className="mt-2.5 text-slate-400 text-sm">•</span>
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                    placeholder="Eylem fiili ile başlayın... örn: React ile e-ticaret platformu geliştirdim"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <AIEnhanceButton
                    content={bullet}
                    contentType="bullet"
                    context={`${exp.position} at ${exp.company}`}
                    onEnhanced={(enhanced) => handleEnhanced(expIndex, bulletIndex, enhanced)}
                    disabled={!bullet.trim()}
                  />
                  {exp.bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBullet(expIndex, bulletIndex)}
                      className="mt-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Kaldır"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
