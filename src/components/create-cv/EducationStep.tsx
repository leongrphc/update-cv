"use client";

import { CVEducationEntry } from "@/types";

interface EducationStepProps {
  data: CVEducationEntry[];
  onChange: (data: CVEducationEntry[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function EducationStep({ data, onChange }: EducationStepProps) {
  const addEducation = () => {
    onChange([
      ...data,
      {
        id: generateId(),
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
      },
    ]);
  };

  const removeEducation = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateEducation = (
    index: number,
    field: keyof CVEducationEntry,
    value: string
  ) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Eğitim geçmişinizi ekleyin.
        </p>
        <button
          type="button"
          onClick={addEducation}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          + Eğitim Ekle
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm">
          <p className="text-slate-500 dark:text-slate-400 mb-3">
            Henüz eğitim bilgisi eklenmedi
          </p>
          <button
            type="button"
            onClick={addEducation}
            className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors text-sm"
          >
            İlk Eğitimi Ekle
          </button>
        </div>
      )}

      {data.map((edu, index) => (
        <div
          key={edu.id}
          className="p-5 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Eğitim {index + 1}
            </span>
            {data.length > 0 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Kaldır
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Okul *
              </label>
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(index, "school", e.target.value)}
                placeholder="örn: İstanbul Teknik Üniversitesi"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Derece
              </label>
              <select
                value={edu.degree || ""}
                onChange={(e) => updateEducation(index, "degree", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Seçiniz</option>
                <option value="Lisans">Lisans</option>
                <option value="Yüksek Lisans">Yüksek Lisans</option>
                <option value="Doktora">Doktora</option>
                <option value="Ön Lisans">Ön Lisans</option>
                <option value="Lise">Lise</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Alan
              </label>
              <input
                type="text"
                value={edu.field || ""}
                onChange={(e) => updateEducation(index, "field", e.target.value)}
                placeholder="örn: Bilgisayar Mühendisliği"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Başlangıç - Bitiş
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={edu.startDate || ""}
                  onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                  placeholder="2018"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="self-center text-slate-400">-</span>
                <input
                  type="text"
                  value={edu.endDate || ""}
                  onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                  placeholder="2022"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                GPA
              </label>
              <input
                type="text"
                value={edu.gpa || ""}
                onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                placeholder="örn: 3.5/4.0"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Açıklama
            </label>
            <textarea
              value={edu.description || ""}
              onChange={(e) => updateEducation(index, "description", e.target.value)}
              rows={2}
              placeholder="Öne çıkan projeler, başarılar, etkinlikler..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
