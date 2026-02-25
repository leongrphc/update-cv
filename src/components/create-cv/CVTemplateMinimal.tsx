"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from "@react-pdf/renderer";
import { CreateCVFormData } from "@/types";
import { getLabels, formatDateL } from "./cv-labels";

Font.register({
  family: "Open Sans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf",
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const colors = {
  black: "#000000",
  dark: "#333333",
  muted: "#999999",
  hairline: "#dddddd",
};

const styles = StyleSheet.create({
  page: {
    padding: 52,
    fontFamily: "Open Sans",
    fontSize: 9.5,
    color: colors.dark,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    marginBottom: 28,
  },
  name: {
    fontSize: 28,
    fontWeight: 400,
    color: colors.black,
    marginBottom: 5,
    letterSpacing: 0,
  },
  title: {
    fontSize: 9.5,
    fontWeight: 400,
    color: colors.muted,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  contactItem: {
    fontSize: 8.5,
    color: colors.muted,
  },
  contactSep: {
    fontSize: 8.5,
    color: colors.hairline,
    marginHorizontal: 6,
  },
  contactLink: {
    fontSize: 8.5,
    color: colors.muted,
    textDecoration: "none",
  },
  // Divider
  headerRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
    marginTop: 14,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontWeight: 600,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  // Summary
  summary: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.7,
  },
  // Experience entries
  entryContainer: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    color: colors.black,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: colors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 8.5,
    color: colors.muted,
    marginBottom: 5,
  },
  // Dash bullets (thin en-dash style)
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDash: {
    width: 12,
    fontSize: 9,
    color: colors.muted,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: colors.dark,
    lineHeight: 1.5,
  },
  // Education
  eduEntry: {
    marginBottom: 10,
  },
  // Skills – comma-separated plain text
  skillsRow: {
    marginBottom: 6,
  },
  skillLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  skillValue: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.6,
  },
  // Languages – inline
  langInline: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.7,
  },
  // Certifications
  certEntry: {
    marginBottom: 5,
  },
  certName: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.black,
  },
  certMeta: {
    fontSize: 8,
    color: colors.muted,
  },
});

export default function CVTemplateMinimal({ data }: { data: CreateCVFormData }) {
  const { personalInfo, experiences, educations, skills } = data;
  const L = getLabels(data.cvLang);

  const contactParts: Array<{ type: "text" | "link"; value: string; label?: string }> = [
    { type: "text" as const, value: personalInfo.email },
    { type: "text" as const, value: personalInfo.phone },
    ...(personalInfo.location ? [{ type: "text" as const, value: personalInfo.location }] : []),
    ...(personalInfo.linkedinUrl ? [{ type: "link" as const, value: personalInfo.linkedinUrl, label: "LinkedIn" }] : []),
    ...(personalInfo.websiteUrl ? [{ type: "link" as const, value: personalInfo.websiteUrl, label: "Web" }] : []),
  ].filter((p) => p.value);

  const languagesInline = skills.languages
    .map((lang) => `${lang.language} (${lang.level})`)
    .join("  ·  ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName}</Text>
          {personalInfo.title ? (
            <Text style={styles.title}>{personalInfo.title}</Text>
          ) : null}

          {/* Contact – single line with bullet separators */}
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                {i > 0 && <Text style={styles.contactSep}>·</Text>}
                {part.type === "link" ? (
                  <Link src={part.value} style={styles.contactLink}>
                    {part.label ?? part.value}
                  </Link>
                ) : (
                  <Text style={styles.contactItem}>{part.value}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.headerRule} />
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.summary}</Text>
            <Text style={styles.summary}>{personalInfo.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.experienceShort}</Text>
            {experiences.map((exp) => (
              <View key={exp.id} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.position}</Text>
                  <Text style={styles.entryDate}>
                    {formatDateL(exp.startDate, data.cvLang)} – {exp.current ? L.present : formatDateL(exp.endDate, data.cvLang)}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {exp.company}{exp.location ? `,  ${exp.location}` : ""}
                </Text>
                {exp.bullets.filter(Boolean).map((bullet, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Text style={styles.bulletDash}>–</Text>
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
            <Text style={styles.sectionTitle}>{L.education}</Text>
            {educations.map((edu) => (
              <View key={edu.id} style={styles.eduEntry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{edu.school}</Text>
                  <Text style={styles.entryDate}>
                    {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[edu.degree, edu.field].filter(Boolean).join(", ")}
                  {edu.gpa ? `  ·  GPA ${edu.gpa}` : ""}
                </Text>
                {edu.description && (
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletDash}>–</Text>
                    <Text style={styles.bulletText}>{edu.description}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.skillsAll}</Text>
            {skills.technical.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.skillLabel}>{L.technicalSkills}</Text>
                <Text style={styles.skillValue}>{skills.technical.join(", ")}</Text>
              </View>
            )}
            {skills.soft.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.skillLabel}>{L.softSkills}</Text>
                <Text style={styles.skillValue}>{skills.soft.join(", ")}</Text>
              </View>
            )}
          </View>
        )}

        {/* Languages */}
        {skills.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.languages}</Text>
            <Text style={styles.langInline}>{languagesInline}</Text>
          </View>
        )}

        {/* Certifications */}
        {skills.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.certifications}</Text>
            {skills.certifications.map((cert) => (
              <View key={cert.id} style={styles.certEntry}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certMeta}>
                  {cert.issuer}{cert.date ? `  ·  ${cert.date}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
}
