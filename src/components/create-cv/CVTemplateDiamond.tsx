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
  sidebarBg: "#064e3b",
  sidebarName: "#ffffff",
  sidebarAccent: "#6ee7b7",
  sidebarTagBg: "#065f46",
  sidebarTagText: "#d1fae5",
  sidebarMuted: "#a7f3d0",
  sidebarBorder: "#065f46",
  mainBg: "#ffffff",
  mainTitle: "#064e3b",
  mainBorder: "#064e3b",
  entryTitle: "#111827",
  entrySubtitle: "#064e3b",
  secondary: "#374151",
  muted: "#6b7280",
  bulletAccent: "#064e3b",
};

const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 10,
    flexDirection: "row",
  },
  // ── Sidebar ──────────────────────────────────────────────
  sidebar: {
    width: "32%",
    backgroundColor: colors.sidebarBg,
    padding: 24,
    paddingTop: 34,
    color: colors.sidebarName,
  },
  sidebarName: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.sidebarName,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  sidebarTitle: {
    fontSize: 9.5,
    color: colors.sidebarAccent,
    marginBottom: 22,
    lineHeight: 1.3,
  },
  sidebarSection: {
    marginBottom: 16,
  },
  sidebarSectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.sidebarAccent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 7,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.sidebarBorder,
  },
  sidebarItem: {
    fontSize: 8,
    color: colors.sidebarMuted,
    marginBottom: 4,
    lineHeight: 1.45,
  },
  sidebarLink: {
    fontSize: 8,
    color: colors.sidebarAccent,
    textDecoration: "none",
    marginBottom: 4,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillTag: {
    fontSize: 7,
    color: colors.sidebarTagText,
    backgroundColor: colors.sidebarTagBg,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 2,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  langName: {
    fontSize: 8.5,
    color: colors.sidebarName,
  },
  langLevel: {
    fontSize: 7.5,
    color: colors.sidebarMuted,
  },
  certEntry: {
    marginBottom: 6,
  },
  certName: {
    fontSize: 8.5,
    fontWeight: 600,
    color: colors.sidebarName,
  },
  certIssuer: {
    fontSize: 7.5,
    color: colors.sidebarMuted,
  },
  // ── Main Content ─────────────────────────────────────────
  main: {
    flex: 1,
    backgroundColor: colors.mainBg,
    padding: 28,
    paddingTop: 34,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: colors.mainTitle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: colors.mainBorder,
  },
  summary: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.65,
    textAlign: "justify",
  },
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
    color: colors.entryTitle,
    flex: 1,
  },
  entryDate: {
    fontSize: 7.5,
    color: colors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: colors.entrySubtitle,
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
    color: colors.bulletAccent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: colors.secondary,
    lineHeight: 1.45,
  },
});

export default function CVTemplateDiamond({ data }: { data: CreateCVFormData }) {
  const { personalInfo, experiences, educations, skills } = data;
  const L = getLabels(data.cvLang);
  const styles = applyPDFTheme(baseStyles, colors, data.theme);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Left Sidebar ── */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{personalInfo.fullName}</Text>
          <Text style={styles.sidebarTitle}>{personalInfo.title}</Text>

          {/* Contact */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{L.contact}</Text>
            <Text style={styles.sidebarItem}>{personalInfo.email}</Text>
            <Text style={styles.sidebarItem}>{personalInfo.phone}</Text>
            {personalInfo.location && (
              <Text style={styles.sidebarItem}>{personalInfo.location}</Text>
            )}
            {personalInfo.linkedinUrl && (
              <Link src={personalInfo.linkedinUrl} style={styles.sidebarLink}>
                {L.linkedinProfile}
              </Link>
            )}
            {personalInfo.websiteUrl && (
              <Link src={personalInfo.websiteUrl} style={styles.sidebarLink}>
                {L.website}
              </Link>
            )}
          </View>

          {/* Technical Skills */}
          {skills.technical.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>{L.technicalSkills}</Text>
              <View style={styles.skillTags}>
                {skills.technical.map((skill, i) => (
                  <Text key={i} style={styles.skillTag}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Soft Skills */}
          {skills.soft.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>{L.softSkills}</Text>
              <View style={styles.skillTags}>
                {skills.soft.map((skill, i) => (
                  <Text key={i} style={styles.skillTag}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {skills.languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>{L.languages}</Text>
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
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>{L.certifications}</Text>
              {skills.certifications.map((cert) => (
                <View key={cert.id} style={styles.certEntry}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certIssuer}>
                    {cert.issuer}
                    {cert.date ? ` | ${cert.date}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Right Main Content ── */}
        <View style={styles.main}>
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
                    {exp.company}
                    {exp.location ? ` | ${exp.location}` : ""}
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
                      {edu.startDate}
                      {edu.endDate ? ` - ${edu.endDate}` : ""}
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
      </Page>
    </Document>
  );
}
