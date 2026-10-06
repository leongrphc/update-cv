"use client";

import { useState } from "react";
import { CVSkillsData, CVLanguageEntry, CVCertificationEntry } from "@/types";

interface SkillsStepProps {
  data: CVSkillsData;
  onChange: (data: CVSkillsData) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const languageLevels: CVLanguageEntry["level"][] = [
  "", "A1", "A2", "B1", "B2", "C1", "C2", "Ana Dil",
];

export default function SkillsStep({ data, onChange }: SkillsStepProps) {
  const [technicalInput, setTechnicalInput] = useState("");
  const [softInput, setSoftInput] = useState("");

  const addSkillTag = (type: "technical" | "soft", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const arr = type === "technical" ? data.technical : data.soft;
    if (arr.includes(trimmed)) return;
    onChange({ ...data, [type]: [...arr, trimmed] });
    if (type === "technical") setTechnicalInput("");
    else setSoftInput("");
  };

  const removeSkillTag = (type: "technical" | "soft", index: number) => {
    const arr = type === "technical" ? data.technical : data.soft;
    onChange({ ...data, [type]: arr.filter((_, i) => i !== index) });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "technical" | "soft"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkillTag(type, type === "technical" ? technicalInput : softInput);
    }
  };

  const addLanguage = () => {
    onChange({
      ...data,
      languages: [...data.languages, { id: generateId(), language: "", level: "" }],
    });
  };

  const removeLanguage = (index: number) => {
    onChange({
      ...data,
      languages: data.languages.filter((_, i) => i !== index),
    });
  };

  const updateLanguage = (index: number, field: keyof CVLanguageEntry, value: string) => {
    const updated = [...data.languages];
    updated[index] = { ...updated[index], [field]: value } as CVLanguageEntry;
    onChange({ ...data, languages: updated });
  };

  const addCertification = () => {
    onChange({
      ...data,
      certifications: [
        ...data.certifications,
        { id: generateId(), name: "", issuer: "", date: "" },
      ],
    });
  };

  const removeCertification = (index: number) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((_, i) => i !== index),
    });
  };

  const updateCertification = (
    index: number,
    field: keyof CVCertificationEntry,
    value: string
  ) => {
    const updated = [...data.certifications];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, certifications: updated });
  };

  return (
    <div className="space-y-8">
      {/* Technical Skills */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Teknik Beceriler
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
          {data.technical.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-sm border border-blue-200 dark:border-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkillTag("technical", index)}
                className="text-blue-400 hover:text-red-500 ml-1"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={technicalInput}
          onChange={(e) => setTechnicalInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "technical")}
          placeholder="Beceri yazıp Enter'a basın... (örn: React, TypeScript, Node.js)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Soft Skills */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Kişisel Beceriler
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
          {data.soft.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-sm border border-green-200 dark:border-green-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkillTag("soft", index)}
                className="text-green-400 hover:text-red-500 ml-1"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={softInput}
          onChange={(e) => setSoftInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "soft")}
          placeholder="Beceri yazıp Enter'a basın... (örn: Liderlik, Problem Çözme)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Languages */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Diller
          </label>
          <button
            type="button"
            onClick={addLanguage}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Dil Ekle
          </button>
        </div>
        <div className="space-y-2">
          {data.languages.map((lang, index) => (
            <div key={lang.id} className="flex items-center gap-3">
              <input
                type="text"
                value={lang.language}
                onChange={(e) => updateLanguage(index, "language", e.target.value)}
                placeholder="Dil adı"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <select
                value={lang.level}
                onChange={(e) => updateLanguage(index, "level", e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {languageLevels.map((level) => (
                  <option key={level} value={level}>
                  {level || "Seviye belirtilmedi"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          {data.languages.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-2">
              Henüz dil eklenmedi
            </p>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Sertifikalar
          </label>
          <button
            type="button"
            onClick={addCertification}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Sertifika Ekle
          </button>
        </div>
        <div className="space-y-3">
          {data.certifications.map((cert, index) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-sm"
            >
              <input
                type="text"
                value={cert.name}
                onChange={(e) => updateCertification(index, "name", e.target.value)}
                placeholder="Sertifika adı"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="text"
                value={cert.issuer}
                onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                placeholder="Veren kurum"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="text"
                value={cert.date || ""}
                onChange={(e) => updateCertification(index, "date", e.target.value)}
                placeholder="Tarih"
                className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => removeCertification(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          {data.certifications.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-2">
              Henüz sertifika eklenmedi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
