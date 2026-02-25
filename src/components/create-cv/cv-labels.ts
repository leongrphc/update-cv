export type CVLang = "tr" | "en";

const labels = {
  tr: {
    summary: "Profesyonel Özet",
    experience: "İş Deneyimi",
    experienceShort: "Deneyim",
    education: "Eğitim",
    technicalSkills: "Teknik Beceriler",
    softSkills: "Kişisel Beceriler",
    languages: "Diller",
    certifications: "Sertifikalar",
    contact: "İletişim",
    skillsAll: "Beceriler ve Yeterlilikler",
    present: "Devam Ediyor",
    presentShort: "Devam",
    linkedinProfile: "LinkedIn Profili",
    website: "Web Sitesi",
    months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  },
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    experienceShort: "Experience",
    education: "Education",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    languages: "Languages",
    certifications: "Certifications",
    contact: "Contact",
    skillsAll: "Skills & Competencies",
    present: "Present",
    presentShort: "Present",
    linkedinProfile: "LinkedIn Profile",
    website: "Website",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
} as const;

export function getLabels(lang?: CVLang) {
  return labels[lang || "tr"];
}

export function formatDateL(date: string | undefined, lang?: CVLang): string {
  if (!date) return "";
  if (date.includes("-")) {
    const [year, month] = date.split("-");
    const l = getLabels(lang);
    return `${l.months[parseInt(month) - 1]} ${year}`;
  }
  return date;
}
