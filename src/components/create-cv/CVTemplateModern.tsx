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
import { CreateCVFormData, type CVTemplateTheme, DEFAULT_THEME } from "@/types";
import { getLabels, formatDateL } from "./cv-labels";

// Register Open Sans font with Turkish character support
import "./pdf-fonts";
import { applyPDFTheme } from "./pdf-theme";

const colors = {
  primary: "#1a1a1a",
  secondary: "#4a4a4a",
  accent: "#2563eb",
  muted: "#6b7280",
  border: "#e5e7eb",
  background: "#ffffff",
  sectionBg: "#f8fafc",
};

const baseStyles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: "Open Sans",
    fontSize: 10,
    color: colors.secondary,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 11,
    color: colors.accent,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contactItem: {
    fontSize: 8,
    color: colors.muted,
  },
  contactLink: {
    fontSize: 8,
    color: colors.accent,
    textDecoration: "none",
  },
  mainContent: {
    flexDirection: "row",
    gap: 20,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryContainer: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: colors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: colors.accent,
    marginBottom: 3,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
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
  summary: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillTag: {
    fontSize: 7.5,
    color: colors.secondary,
    backgroundColor: colors.sectionBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  langName: {
    fontSize: 8.5,
    color: colors.secondary,
  },
  langLevel: {
    fontSize: 8,
    color: colors.muted,
  },
  certEntry: {
    marginBottom: 4,
  },
  certName: {
    fontSize: 8.5,
    fontWeight: 600,
    color: colors.primary,
  },
  certIssuer: {
    fontSize: 8,
    color: colors.muted,
  },
});

interface CVTemplateModernProps {
  data: CreateCVFormData;
  theme?: CVTemplateTheme;
}

export default function CVTemplateModern({ data, theme: customTheme }: CVTemplateModernProps) {
  const { personalInfo, experiences, educations, skills } = data;
  const L = getLabels(data.cvLang);
  const tm = customTheme || data.theme || DEFAULT_THEME;
  const styles = applyPDFTheme(baseStyles, colors, customTheme || data.theme);

  const dynColors = {
    ...colors,
    primary: tm.primaryColor,
    accent: tm.accentColor,
  };

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily: tm.fontFamily, fontSize: tm.fontSize }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: dynColors.primary }]}>
          <Text style={[styles.name, { color: dynColors.primary }]}>{personalInfo.fullName}</Text>
          <Text style={[styles.title, { color: dynColors.accent }]}>{personalInfo.title}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>{personalInfo.email}</Text>
            <Text style={styles.contactItem}>{personalInfo.phone}</Text>
            {personalInfo.location && (
              <Text style={styles.contactItem}>{personalInfo.location}</Text>
            )}
            {personalInfo.linkedinUrl && (
              <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                LinkedIn
              </Link>
            )}
            {personalInfo.websiteUrl && (
              <Link src={personalInfo.websiteUrl} style={styles.contactLink}>
                Web
              </Link>
            )}
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
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
                        {formatDateL(exp.startDate, data.cvLang)} -{" "}
                        {exp.current ? L.presentShort : formatDateL(exp.endDate, data.cvLang)}
                      </Text>
                    </View>
                    <Text style={styles.entrySubtitle}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
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
            <CustomPDFSections sections={data.customSections} titleStyle={styles.sectionTitle} textStyle={styles.bulletText} />
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Technical Skills */}
            {skills.technical.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{L.technicalSkills}</Text>
                <View style={styles.skillTags}>
                  {skills.technical.map((skill, i) => (
                    <Text key={i} style={styles.skillTag}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Soft Skills */}
            {skills.soft.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{L.softSkills}</Text>
                <View style={styles.skillTags}>
                  {skills.soft.map((skill, i) => (
                    <Text key={i} style={styles.skillTag}>{skill}</Text>
                  ))}
                </View>
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
          </View>
        </View>

      </Page>
    </Document>
  );
}
