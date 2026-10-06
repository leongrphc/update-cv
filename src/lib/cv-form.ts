import { z } from "zod";
import { cvThemeSchema } from "./cv-theme";

const short = z.string().max(500).default("");
const entryId = z.string().min(1).default(() => crypto.randomUUID());
// Drafts can be incomplete or temporarily invalid while the user is typing.
export const cvFormSchema = z.object({
  customSections: z.array(z.object({ id: entryId, title: z.string().max(200), content: z.string().max(50_000) })).max(20).default([]),
  targetRole: z.string().max(200).optional(),
  id: z.string().min(1).optional(), title: z.string().max(200).optional(),
  cvLang: z.enum(["tr", "en"]).default("tr"), theme: cvThemeSchema.optional(),
  templateId: z.enum(["modern", "classic", "creative", "executive", "minimal", "diamond"]).default("modern"),
  personalInfo: z.object({ fullName: z.string().max(200).default(""), title: short,
    email: short, phone: short, location: short, linkedinUrl: short, websiteUrl: short,
    summary: z.string().max(50_000).default("") }),
  experiences: z.array(z.object({ id: entryId, position: short, company: short, location: short,
    startDate: short, endDate: short, current: z.boolean().default(false),
    bullets: z.array(z.string().max(50_000)).max(1000).default([]) })).max(200).default([]),
  educations: z.array(z.object({ id: entryId, school: short, degree: short, field: short,
    startDate: short, endDate: short, gpa: short, description: z.string().max(50_000).default("") })).max(200).default([]),
  skills: z.object({ technical: z.array(z.string()).max(1000).default([]), soft: z.array(z.string()).max(1000).default([]),
    languages: z.array(z.object({ id: entryId, language: short,
      level: z.enum(["", "A1", "A2", "B1", "B2", "C1", "C2", "Ana Dil"]).default("") })).max(100).default([]),
    certifications: z.array(z.object({ id: entryId, name: short, issuer: short, date: short })).max(200).default([]),
  }).default({}),
});
export const emptyCV = () => cvFormSchema.parse({ personalInfo: {} });
