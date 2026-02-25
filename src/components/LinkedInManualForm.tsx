"use client";

import { useState } from "react";
import { LinkedInProfile, LinkedInExperience, LinkedInEducation } from "@/types";

interface LinkedInManualFormProps {
  onSubmit: (profile: LinkedInProfile) => void;
  onCancel: () => void;
}

export default function LinkedInManualForm({ onSubmit, onCancel }: LinkedInManualFormProps) {
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<LinkedInExperience[]>([
    { title: "", company: "", startDate: "", current: false },
  ]);
  const [educations, setEducations] = useState<LinkedInEducation[]>([
    { school: "", degree: "", field: "" },
  ]);

  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", company: "", startDate: "", current: false },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof LinkedInExperience, value: string | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const addEducation = () => {
    setEducations([...educations, { school: "", degree: "", field: "" }]);
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof LinkedInEducation, value: string) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profile: LinkedInProfile = {
      fullName,
      headline: headline || undefined,
      location: location || undefined,
      summary: summary || undefined,
      experience: experiences.filter((exp) => exp.title && exp.company),
      education: educations.filter((edu) => edu.school),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      sourceType: "manual",
    };

    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ad Soyad *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Profesyonel Başlık
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="örn: Senior Software Engineer"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Konum
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="örn: İstanbul, Türkiye"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Özet
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="LinkedIn profilinizdeki özet bölümü..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Beceriler (virgülle ayırın)
        </label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="örn: JavaScript, React, Node.js, TypeScript"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Experience Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Deneyim
          </label>
          <button
            type="button"
            onClick={addExperience}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Deneyim Ekle
          </button>
        </div>
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-sm space-y-3"
            >
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Deneyim {index + 1}
                </span>
                {experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Kaldır
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, "title", e.target.value)}
                  placeholder="Pozisyon"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, "company", e.target.value)}
                  placeholder="Şirket"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
                <input
                  type="text"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                  placeholder="Başlangıç (YYYY-MM)"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(index, "current", e.target.checked)}
                    className="rounded-sm"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Halen çalışıyor
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Eğitim
          </label>
          <button
            type="button"
            onClick={addEducation}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Eğitim Ekle
          </button>
        </div>
        <div className="space-y-4">
          {educations.map((edu, index) => (
            <div
              key={index}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-sm space-y-3"
            >
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Eğitim {index + 1}
                </span>
                {educations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Kaldır
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => updateEducation(index, "school", e.target.value)}
                  placeholder="Okul"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
                <input
                  type="text"
                  value={edu.degree || ""}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  placeholder="Derece (Lisans, YL vb.)"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
                <input
                  type="text"
                  value={edu.field || ""}
                  onChange={(e) => updateEducation(index, "field", e.target.value)}
                  placeholder="Alan"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={!fullName}
          className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Profili Kaydet
        </button>
      </div>
    </form>
  );
}
