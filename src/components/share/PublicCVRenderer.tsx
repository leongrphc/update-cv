"use client";

import type { CVPersonalInfo, CVExperienceEntry, CVEducationEntry, CVSkillsData } from "@/types";

interface PublicCVRendererProps {
  personalInfo: CVPersonalInfo;
  experiences: CVExperienceEntry[];
  educations: CVEducationEntry[];
  skills: CVSkillsData;
}

export function PublicCVRenderer({
  personalInfo,
  experiences,
  educations,
  skills,
}: PublicCVRendererProps) {
  return (
    <div className="max-w-[210mm] mx-auto bg-white text-gray-900 p-8 shadow-lg print:shadow-none print:p-0">
      {/* Header */}
      <header className="border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{personalInfo.fullName}</h1>
        {personalInfo.title && (
          <p className="text-lg text-gray-600 mt-1">{personalInfo.title}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedinUrl && (
            <span className="text-blue-600">{personalInfo.linkedinUrl}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
            Profesyonel Özet
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">{personalInfo.summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            İş Deneyimi
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{exp.position}</h3>
                    <p className="text-sm text-gray-600">
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {exp.startDate}
                    {exp.current ? " — Devam" : exp.endDate ? ` — ${exp.endDate}` : ""}
                  </span>
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.filter(Boolean).map((bullet, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            Eğitim
          </h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold">{edu.school}</h3>
                    <p className="text-sm text-gray-600">
                      {[edu.degree, edu.field].filter(Boolean).join(" · ")}
                      {edu.gpa ? ` · GPA: ${edu.gpa}` : ""}
                    </p>
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-xs text-gray-400">
                      {edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ""}
                    </span>
                  )}
                </div>
                {edu.description && (
                  <p className="text-sm text-gray-600 mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            Beceriler
          </h2>
          {skills.technical.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Teknik: </span>
              <span className="text-sm text-gray-700">{skills.technical.join(", ")}</span>
            </div>
          )}
          {skills.soft.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Soft: </span>
              <span className="text-sm text-gray-700">{skills.soft.join(", ")}</span>
            </div>
          )}
        </section>
      )}

      {/* Languages */}
      {skills.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            Diller
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.languages.map((lang) => (
              <span key={lang.id} className="text-sm text-gray-700">
                {lang.language} <span className="text-gray-400">({lang.level})</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {skills.certifications.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
            Sertifikalar
          </h2>
          <div className="space-y-1">
            {skills.certifications.map((cert) => (
              <div key={cert.id} className="text-sm text-gray-700">
                <span className="font-medium">{cert.name}</span>
                <span className="text-gray-400"> — {cert.issuer}</span>
                {cert.date && <span className="text-gray-400"> ({cert.date})</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
