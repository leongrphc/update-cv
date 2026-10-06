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
  primary: "#1a1a1a",
  secondary: "#4a4a4a",
  accent: "#1e40af",
  muted: "#6b7280",
  border: "#d1d5db",
};

const baseStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Open Sans",
    fontSize: 10,
    color: colors.secondary,
  },
  header: {
    textAlign: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: {
    fontSize: 11,
    color: colors.accent,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  contactItem: {
    fontSize: 8.5,
    color: colors.muted,
  },
  contactSep: {
    fontSize: 8.5,
    color: colors.border,
  },
  contactLink: {
    fontSize: 8.5,
    color: colors.accent,
    textDecoration: "none",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summary: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  entryContainer: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.primary,
  },
  entryDate: {
    fontSize: 8.5,
    color: colors.muted,
  },
  entrySubtitle: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: 600,
    marginBottom: 3,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    color: colors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: colors.secondary,
    lineHeight: 1.4,
  },
  skillsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  skillLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.primary,
    width: 120,
  },
  skillValue: {
    fontSize: 9,
    color: colors.secondary,
    flex: 1,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  langName: {
    fontSize: 9,
    color: colors.secondary,
  },
  langLevel: {
    fontSize: 8.5,
    color: colors.muted,
  },
  certEntry: {
    marginBottom: 4,
  },
  certName: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.primary,
  },
  certIssuer: {
    fontSize: 8,
    color: colors.muted,
  },
});

interface CVTemplateClassicProps {
  data: CreateCVFormData;
}

export default function CVTemplateClassic({ data }: CVTemplateClassicProps) {
  const { personalInfo, experiences, educations, skills } = data;
  const L = getLabels(data.cvLang);
  const styles = applyPDFTheme(baseStyles, colors, data.theme);

  const contactParts: string[] = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location || "",
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Centered */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName}</Text>
          <Text style={styles.title}>{personalInfo.title}</Text>
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                {i > 0 && <Text style={styles.contactSep}>|</Text>}
                <Text style={styles.contactItem}>{part}</Text>
              </View>
            ))}
            {personalInfo.linkedinUrl && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Text style={styles.contactSep}>|</Text>
                <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                  LinkedIn
                </Link>
              </View>
            )}
            {personalInfo.websiteUrl && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Text style={styles.contactSep}>|</Text>
                <Link src={personalInfo.websiteUrl} style={styles.contactLink}>
                  Web
                </Link>
              </View>
            )}
          </View>
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
            <Text style={styles.sectionTitle}>{L.experience}</Text>
            {experiences.map((exp) => (
              <View key={exp.id} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.position}</Text>
                  <Text style={styles.entryDate}>
                    {formatDateL(exp.startDate, data.cvLang)} -{" "}
                    {exp.current ? L.present : formatDateL(exp.endDate, data.cvLang)}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ""}
                </Text>
                {exp.bullets.filter(Boolean).map((bullet, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Text style={styles.bulletDot}>•</Text>
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

        {/* Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.skillsAll}</Text>
            {skills.technical.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.skillLabel}>{L.technicalSkills}:</Text>
                <Text style={styles.skillValue}>{skills.technical.join(", ")}</Text>
              </View>
            )}
            {skills.soft.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.skillLabel}>{L.softSkills}:</Text>
                <Text style={styles.skillValue}>{skills.soft.join(", ")}</Text>
              </View>
            )}
          </View>
        )}

        {/* Languages */}
        {skills.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.languages}</Text>
            {skills.languages.map((lang) => (
              <View key={lang.id} style={styles.langRow}>
                <Text style={styles.langName}>{lang.language}</Text>
                <Text style={styles.langLevel}>{lang.level}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {skills.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.certifications}</Text>
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

        <CustomPDFSections sections={data.customSections} titleStyle={styles.sectionTitle} textStyle={styles.bulletText} />
      </Page>
    </Document>
  );
}
