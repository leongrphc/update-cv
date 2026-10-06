"use client";
import CustomPDFSections from "./CustomPDFSections";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { CreateCVFormData } from "@/types";
import { getLabels, formatDateL } from "./cv-labels";

import "./pdf-fonts";
import { applyPDFTheme } from "./pdf-theme";

const colors = {
  navy: "#0f172a",
  gold: "#d4a853",
  goldLight: "#e8c97a",
  white: "#ffffff",
  primary: "#0f172a",
  secondary: "#374151",
  muted: "#6b7280",
  border: "#e5e7eb",
  background: "#ffffff",
};

const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 10,
    color: colors.secondary,
    backgroundColor: colors.background,
  },

  // ── Top Banner ──────────────────────────────────────────────────────
  banner: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 24,
  },
  bannerName: {
    fontSize: 26,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 0.5,
    marginBottom: 14,
    fontWeight: 600,
  },
  bannerContactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  bannerSep: {
    color: colors.gold,
    fontSize: 8,
    opacity: 0.6,
  },
  bannerContactItem: {
    fontSize: 8.5,
    color: "#94a3b8",
  },
  bannerContactLink: {
    fontSize: 8.5,
    color: colors.gold,
    textDecoration: "none",
  },

  // ── Gold accent rule below banner ────────────────────────────────────
  goldRule: {
    height: 3,
    backgroundColor: colors.gold,
  },

  // ── Body ─────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Sections ─────────────────────────────────────────────────────────
  section: {
    marginBottom: 18,
  },
  sectionTitleWrapper: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.navy,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  sectionGoldUnderline: {
    height: 1.5,
    backgroundColor: colors.gold,
    width: 36,
    marginBottom: 1,
  },
  sectionThinRule: {
    height: 0.5,
    backgroundColor: colors.border,
  },

  // ── Summary ───────────────────────────────────────────────────────────
  summary: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.65,
    textAlign: "justify",
  },

  // ── Experience / Education entries ────────────────────────────────────
  entryContainer: {
    marginBottom: 11,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.navy,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: colors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: 600,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    color: colors.gold,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: colors.secondary,
    lineHeight: 1.45,
  },

  // ── Skills 2-column grid ──────────────────────────────────────────────
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  skillsColumn: {
    width: "50%",
    paddingRight: 12,
    marginBottom: 6,
  },
  skillsColumnTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: colors.navy,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  skillTag: {
    fontSize: 8,
    color: colors.secondary,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },

  // ── Languages & Certifications (inline row style) ─────────────────────
  inlineRow: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  langBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  langDot: {
    width: 5,
    height: 5,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  langName: {
    fontSize: 8.5,
    fontWeight: 600,
    color: colors.navy,
  },
  langLevel: {
    fontSize: 8,
    color: colors.muted,
  },
  certEntry: {
    marginBottom: 5,
  },
  certName: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.navy,
  },
  certIssuer: {
    fontSize: 8,
    color: colors.muted,
  },
});

export default function CVTemplateExecutive({ data }: { data: CreateCVFormData }) {
  const { personalInfo, experiences, educations, skills } = data;
  const L = getLabels(data.cvLang);
  const styles = applyPDFTheme(baseStyles, colors, data.theme);

  const contactParts: { type: "text" | "link"; value: string; label?: string }[] = [
    { type: "text", value: personalInfo.email },
    { type: "text", value: personalInfo.phone },
    ...(personalInfo.location ? [{ type: "text" as const, value: personalInfo.location }] : []),
    ...(personalInfo.linkedinUrl ? [{ type: "link" as const, value: personalInfo.linkedinUrl, label: "LinkedIn" }] : []),
    ...(personalInfo.websiteUrl ? [{ type: "link" as const, value: personalInfo.websiteUrl, label: "Web" }] : []),
  ];

  const hasSkills =
    skills.technical.length > 0 ||
    skills.soft.length > 0 ||
    skills.languages.length > 0 ||
    skills.certifications.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Top Navy Banner ─────────────────────────────────────────── */}
        <View style={styles.banner}>
          <Text style={styles.bannerName}>{personalInfo.fullName}</Text>
          <Text style={styles.bannerTitle}>{personalInfo.title}</Text>
          <View style={styles.bannerContactRow}>
            {contactParts.map((part, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {i > 0 && <Text style={styles.bannerSep}>|</Text>}
                {part.type === "link" ? (
                  <Link src={part.value} style={styles.bannerContactLink}>
                    {part.label ?? part.value}
                  </Link>
                ) : (
                  <Text style={styles.bannerContactItem}>{part.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Gold accent rule ─────────────────────────────────────────── */}
        <View style={styles.goldRule} />

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>{L.summary}</Text>
                <View style={styles.sectionGoldUnderline} />
                <View style={styles.sectionThinRule} />
              </View>
              <Text style={styles.summary}>{personalInfo.summary}</Text>
            </View>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>{L.experience}</Text>
                <View style={styles.sectionGoldUnderline} />
                <View style={styles.sectionThinRule} />
              </View>
              {experiences.map((exp) => (
                <View key={exp.id} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{exp.position}</Text>
                    <Text style={styles.entryDate}>
                      {formatDateL(exp.startDate, data.cvLang)} - {exp.current ? L.present : formatDateL(exp.endDate, data.cvLang)}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>
                    {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                  </Text>
                  {exp.bullets.filter(Boolean).map((bullet, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>-</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>{L.education}</Text>
                <View style={styles.sectionGoldUnderline} />
                <View style={styles.sectionThinRule} />
              </View>
              {educations.map((edu) => (
                <View key={edu.id} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{edu.school}</Text>
                    <Text style={styles.entryDate}>
                      {edu.startDate}{edu.endDate ? ` - ${edu.endDate}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>
                    {[edu.degree, edu.field].filter(Boolean).join(" - ")}
                    {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                  </Text>
                  {edu.description && (
                    <Text style={styles.bulletText}>{edu.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Skills 2-column grid */}
          {hasSkills && (
            <View style={styles.section}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>{L.skillsAll}</Text>
                <View style={styles.sectionGoldUnderline} />
                <View style={styles.sectionThinRule} />
              </View>
              <View style={styles.skillsGrid}>

                {/* Technical Skills column */}
                {skills.technical.length > 0 && (
                  <View style={styles.skillsColumn}>
                    <Text style={styles.skillsColumnTitle}>{L.technicalSkills}</Text>
                    {skills.technical.map((skill, i) => (
                      <Text key={i} style={styles.skillTag}>{skill}</Text>
                    ))}
                  </View>
                )}

                {/* Soft Skills column */}
                {skills.soft.length > 0 && (
                  <View style={styles.skillsColumn}>
                    <Text style={styles.skillsColumnTitle}>{L.softSkills}</Text>
                    {skills.soft.map((skill, i) => (
                      <Text key={i} style={styles.skillTag}>{skill}</Text>
                    ))}
                  </View>
                )}

                {/* Languages column */}
                {skills.languages.length > 0 && (
                  <View style={styles.skillsColumn}>
                    <Text style={styles.skillsColumnTitle}>{L.languages}</Text>
                    {skills.languages.map((lang) => (
                      <View key={lang.id} style={styles.langBlock}>
                        <View style={styles.langDot} />
                        <Text style={styles.langName}>{lang.language}</Text>
                        <Text style={styles.langLevel}>({lang.level})</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Certifications column */}
                {skills.certifications.length > 0 && (
                  <View style={styles.skillsColumn}>
                    <Text style={styles.skillsColumnTitle}>{L.certifications}</Text>
                    {skills.certifications.map((cert) => (
                      <View key={cert.id} style={styles.certEntry}>
                        <Text style={styles.certName}>{cert.name}</Text>
                        <Text style={styles.certIssuer}>
                          {cert.issuer}{cert.date ? ` | ${cert.date}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

              </View>
            </View>
          )}

        </View>
        <CustomPDFSections sections={data.customSections} titleStyle={styles.sectionTitle} textStyle={styles.bulletText} />
      </Page>
    </Document>
  );
}
