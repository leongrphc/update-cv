"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { PDFTemplateId } from "@/types";

import "./create-cv/pdf-fonts";

// ============================================
// SHARED TYPES & PARSER
// ============================================

interface PDFDownloadButtonProps {
  content: string;
  targetRole?: string;
  atsScore?: { before: number; after: number };
  userName?: string;
  templateId?: PDFTemplateId;
}

interface CVSection {
  type:
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "certifications"
    | "projects"
    | "languages"
    | "other";
  title: string;
  content: string[];
  entries?: {
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
    bullets?: string[];
  }[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, "")     // ## Header → Header
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1")     // *italic* → italic
    .replace(/__([^_]+)__/g, "$1")     // __bold__ → bold
    .replace(/_([^_]+)_/g, "$1")       // _italic_ → italic
    .trim();
}

function parseCV(content: string): CVSection[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const sections: CVSection[] = [];

  const sectionPatterns: { pattern: RegExp; type: CVSection["type"] }[] = [
    {
      pattern: /^(ÖZET|SUMMARY|PROFİL|PROFILE|HAKKIMDA|ABOUT)/i,
      type: "summary",
    },
    {
      pattern:
        /^(DENEYİM|EXPERIENCE|İŞ DENEYİMİ|WORK EXPERIENCE|ÇALIŞMA GEÇMİŞİ|PROFESYONEL DENEYİM)/i,
      type: "experience",
    },
    { pattern: /^(EĞİTİM|EDUCATION|AKADEMİK|ACADEMIC)/i, type: "education" },
    {
      pattern:
        /^(BECERİLER|SKILLS|TEKNİK BECERİLER|TECHNICAL SKILLS|YETKİNLİKLER|TEMEL BECERİLER)/i,
      type: "skills",
    },
    {
      pattern: /^(SERTİFİKALAR|CERTIFICATIONS|SERTİFİKA)/i,
      type: "certifications",
    },
    { pattern: /^(PROJELER|PROJECTS|PROJE)/i, type: "projects" },
    { pattern: /^(DİLLER|LANGUAGES|YABANCI DİL)/i, type: "languages" },
  ];

  let currentSection: CVSection | null = null;
  let currentEntry: {
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
    bullets?: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    const line = stripMarkdown(rawLine);
    const cleanedForMatch = line.replace(/:/g, "").trim().toUpperCase();

    let matchedType: CVSection["type"] | null = null;
    for (const { pattern, type } of sectionPatterns) {
      if (pattern.test(cleanedForMatch)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      if (currentSection) {
        if (currentEntry && currentSection.entries) {
          currentSection.entries.push(currentEntry);
        }
        sections.push(currentSection);
      }

      currentSection = {
        type: matchedType,
        title: line.replace(/:/g, "").trim(),
        content: [],
        entries:
          matchedType !== "summary" &&
          matchedType !== "skills" &&
          matchedType !== "languages"
            ? []
            : undefined,
      };
      currentEntry = null;
    } else if (currentSection) {
      const isEntryTitle =
        currentSection.entries !== undefined &&
        !line.startsWith("-") &&
        !line.startsWith("•") &&
        line.length > 0 &&
        (line.includes("|") ||
          /\d{4}/.test(line) ||
          /^\s*[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(line));

      if (
        isEntryTitle &&
        currentSection.type !== "summary" &&
        currentSection.type !== "skills"
      ) {
        if (currentEntry && currentSection.entries) {
          currentSection.entries.push(currentEntry);
        }

        const dateMatch = line.match(
          /(\d{4}(?:[-.\/]\d{2})?\s*[-–]\s*(?:\d{4}(?:[-.\/]\d{2})?|Günümüz|Devam|Present|Halen|Current)|\d{4}(?:[-.\/]\d{2})?)/i,
        );
        const parts = line.split(/\s*[|]\s*/);

        currentEntry = {
          title: parts[0]?.replace(dateMatch?.[0] || "", "").trim() || line,
          subtitle: parts[1]?.replace(dateMatch?.[0] || "", "").trim(),
          date: dateMatch?.[0],
          bullets: [],
        };
      } else if (line.startsWith("-") || line.startsWith("•")) {
        const bulletText = line.replace(/^[-•]\s*/, "").trim();
        if (currentEntry && currentEntry.bullets) {
          currentEntry.bullets.push(bulletText);
        } else {
          currentSection.content.push(bulletText);
        }
      } else {
        if (currentEntry) {
          if (!currentEntry.description) {
            currentEntry.description = line;
          } else {
            currentEntry.description += " " + line;
          }
        } else {
          currentSection.content.push(line);
        }
      }
    } else {
      if (!sections.length && line) {
        if (!currentSection) {
          currentSection = { type: "other", title: "", content: [] };
        }
        currentSection.content.push(line);
      }
    }
  }

  if (currentSection) {
    if (currentEntry && currentSection.entries) {
      currentSection.entries.push(currentEntry);
    }
    sections.push(currentSection);
  }

  return sections;
}

// ============================================
// MODERN TEMPLATE (Original - 2 column)
// ============================================

const modernColors = {
  primary: "#1a1a1a",
  secondary: "#4a4a4a",
  accent: "#2563eb",
  muted: "#6b7280",
  border: "#e5e7eb",
  background: "#ffffff",
  sectionBg: "#f8fafc",
};

const modernStyles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Open Sans",
    fontSize: 9,
    color: modernColors.secondary,
    backgroundColor: modernColors.background,
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: modernColors.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    color: modernColors.primary,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainContent: {
    flexDirection: "row",
    gap: 18,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: modernColors.border,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: modernColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: modernColors.border,
  },
  entryContainer: {
    marginBottom: 8,
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
    color: modernColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: modernColors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: modernColors.accent,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: modernColors.secondary,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: modernColors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: modernColors.secondary,
    lineHeight: 1.35,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  skillTag: {
    fontSize: 7.5,
    color: modernColors.secondary,
    backgroundColor: modernColors.sectionBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  summary: {
    fontSize: 9,
    color: modernColors.secondary,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 3,
  },
  textContent: {
    fontSize: 8,
    color: modernColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentModern({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";

  const mainSections = sections.filter(
    (s) =>
      s.type === "summary" ||
      s.type === "experience" ||
      s.type === "education" ||
      s.type === "projects",
  );
  const sideSections = sections.filter(
    (s) =>
      s.type === "skills" ||
      s.type === "certifications" ||
      s.type === "languages",
  );

  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.header}>
          <Text style={modernStyles.name}>{displayName}</Text>
          {targetRole && (
            <Text style={{ fontSize: 11, color: modernColors.muted, marginTop: 2 }}>
              {targetRole}
            </Text>
          )}
        </View>

        <View style={modernStyles.mainContent}>
          <View style={modernStyles.leftColumn}>
            {mainSections.map((section, idx) => (
              <View key={idx} style={modernStyles.section}>
                {section.title && (
                  <Text style={modernStyles.sectionTitle}>{section.title}</Text>
                )}
                {section.type === "summary" && section.content.length > 0 && (
                  <Text style={modernStyles.summary}>
                    {section.content.join(" ")}
                  </Text>
                )}
                {section.entries?.map((entry, entryIdx) => (
                  <View key={entryIdx} style={modernStyles.entryContainer}>
                    <View style={modernStyles.entryHeader}>
                      <Text style={modernStyles.entryTitle}>{entry.title}</Text>
                      {entry.date && (
                        <Text style={modernStyles.entryDate}>{entry.date}</Text>
                      )}
                    </View>
                    {entry.subtitle && (
                      <Text style={modernStyles.entrySubtitle}>{entry.subtitle}</Text>
                    )}
                    {entry.description && (
                      <Text style={modernStyles.entryDescription}>
                        {entry.description}
                      </Text>
                    )}
                    {entry.bullets && entry.bullets.length > 0 && (
                      <View style={modernStyles.bulletList}>
                        {entry.bullets.map((bullet, bulletIdx) => (
                          <View key={bulletIdx} style={modernStyles.bulletItem}>
                            <Text style={modernStyles.bulletDot}>•</Text>
                            <Text style={modernStyles.bulletText}>{bullet}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                {!section.entries &&
                  section.type !== "summary" &&
                  section.content.length > 0 && (
                    <View style={modernStyles.bulletList}>
                      {section.content.map((item, itemIdx) => (
                        <View key={itemIdx} style={modernStyles.bulletItem}>
                          <Text style={modernStyles.bulletDot}>•</Text>
                          <Text style={modernStyles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </View>

          {sideSections.length > 0 && (
            <View style={modernStyles.rightColumn}>
              {sideSections.map((section, idx) => (
                <View key={idx} style={modernStyles.section}>
                  <Text style={modernStyles.sectionTitle}>{section.title}</Text>
                  {section.type === "skills" && (
                    <View style={modernStyles.skillTags}>
                      {section.content.map((skill, skillIdx) => (
                        <Text key={skillIdx} style={modernStyles.skillTag}>
                          {skill.replace(/^[-•]\s*/, "")}
                        </Text>
                      ))}
                    </View>
                  )}
                  {section.type !== "skills" && section.content.length > 0 && (
                    <View>
                      {section.content.map((item, itemIdx) => (
                        <Text key={itemIdx} style={modernStyles.textContent}>
                          {item.startsWith("-") || item.startsWith("•")
                            ? item.replace(/^[-•]\s*/, "• ")
                            : item}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </Page>
    </Document>
  );
}

// ============================================
// CLASSIC TEMPLATE (Single column, centered header)
// ============================================

const classicColors = {
  primary: "#1e3a5f",
  secondary: "#333333",
  accent: "#1e3a5f",
  muted: "#666666",
  border: "#1e3a5f",
  background: "#ffffff",
};

const classicStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Open Sans",
    fontSize: 9,
    color: classicColors.secondary,
    backgroundColor: classicColors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: classicColors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: classicColors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: classicColors.muted,
    marginTop: 1,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: classicColors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: classicColors.border,
  },
  entryContainer: {
    marginBottom: 7,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: classicColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: classicColors.muted,
    textAlign: "right",
    fontWeight: 600,
  },
  entrySubtitle: {
    fontSize: 9,
    color: classicColors.muted,
    fontWeight: 600,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: classicColors.secondary,
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: classicColors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: classicColors.secondary,
    lineHeight: 1.35,
  },
  skillLine: {
    fontSize: 8,
    color: classicColors.secondary,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  summary: {
    fontSize: 9,
    color: classicColors.secondary,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 3,
  },
  textContent: {
    fontSize: 8,
    color: classicColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentClassic({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";

  const allSections = sections.filter((s) => s.type !== "other");

  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
          <Text style={classicStyles.name}>{displayName}</Text>
          {targetRole && (
            <Text style={classicStyles.subtitle}>{targetRole}</Text>
          )}
        </View>

        {allSections.map((section, idx) => (
          <View key={idx} style={classicStyles.section}>
            {section.title && (
              <Text style={classicStyles.sectionTitle}>{section.title}</Text>
            )}

            {section.type === "summary" && section.content.length > 0 && (
              <Text style={classicStyles.summary}>
                {section.content.join(" ")}
              </Text>
            )}

            {section.type === "skills" && (
              <Text style={classicStyles.skillLine}>
                {section.content.map((s) => s.replace(/^[-•]\s*/, "")).join(", ")}
              </Text>
            )}

            {section.entries?.map((entry, entryIdx) => (
              <View key={entryIdx} style={classicStyles.entryContainer}>
                <View style={classicStyles.entryHeader}>
                  <Text style={classicStyles.entryTitle}>{entry.title}</Text>
                  {entry.date && (
                    <Text style={classicStyles.entryDate}>{entry.date}</Text>
                  )}
                </View>
                {entry.subtitle && (
                  <Text style={classicStyles.entrySubtitle}>{entry.subtitle}</Text>
                )}
                {entry.description && (
                  <Text style={classicStyles.entryDescription}>
                    {entry.description}
                  </Text>
                )}
                {entry.bullets && entry.bullets.length > 0 && (
                  <View style={classicStyles.bulletList}>
                    {entry.bullets.map((bullet, bulletIdx) => (
                      <View key={bulletIdx} style={classicStyles.bulletItem}>
                        <Text style={classicStyles.bulletDot}>•</Text>
                        <Text style={classicStyles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {!section.entries &&
              section.type !== "summary" &&
              section.type !== "skills" &&
              section.content.length > 0 && (
                <View>
                  {section.content.map((item, itemIdx) => (
                    <Text key={itemIdx} style={classicStyles.textContent}>
                      {item.startsWith("-") || item.startsWith("•")
                        ? item.replace(/^[-•]\s*/, "• ")
                        : item}
                    </Text>
                  ))}
                </View>
              )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ============================================
// CREATIVE TEMPLATE (Dark sidebar + white main)
// ============================================

const creativeColors = {
  sidebar: "#1e293b",
  sidebarText: "#e2e8f0",
  sidebarAccent: "#38bdf8",
  sidebarMuted: "#94a3b8",
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#0ea5e9",
  muted: "#64748b",
  border: "#e2e8f0",
  background: "#ffffff",
};

const creativeStyles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 9,
    flexDirection: "row",
  },
  sidebar: {
    width: 160,
    backgroundColor: creativeColors.sidebar,
    padding: 18,
    paddingTop: 28,
    color: creativeColors.sidebarText,
  },
  mainArea: {
    flex: 1,
    padding: 25,
    paddingLeft: 22,
    backgroundColor: creativeColors.background,
    color: creativeColors.secondary,
  },
  sidebarName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 3,
  },
  sidebarRole: {
    fontSize: 8,
    color: creativeColors.sidebarAccent,
    marginBottom: 14,
  },
  sidebarSection: {
    marginBottom: 10,
  },
  sidebarSectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: creativeColors.sidebarAccent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  sidebarItem: {
    fontSize: 7.5,
    color: creativeColors.sidebarText,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  sidebarSkillTag: {
    fontSize: 7.5,
    color: creativeColors.sidebarText,
    backgroundColor: "#334155",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 2,
  },
  mainSection: {
    marginBottom: 10,
  },
  mainSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: creativeColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: creativeColors.accent,
  },
  entryContainer: {
    marginBottom: 8,
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
    color: creativeColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: creativeColors.accent,
    fontWeight: 600,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: creativeColors.muted,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: creativeColors.secondary,
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: creativeColors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: creativeColors.secondary,
    lineHeight: 1.35,
  },
  summary: {
    fontSize: 9,
    color: creativeColors.secondary,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 3,
  },
  textContent: {
    fontSize: 8,
    color: creativeColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentCreative({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";

  const mainSections = sections.filter(
    (s) =>
      s.type === "summary" ||
      s.type === "experience" ||
      s.type === "education" ||
      s.type === "projects",
  );
  const sideSections = sections.filter(
    (s) =>
      s.type === "skills" ||
      s.type === "certifications" ||
      s.type === "languages",
  );

  return (
    <Document>
      <Page size="A4" style={creativeStyles.page}>
        {/* Dark Sidebar */}
        <View style={creativeStyles.sidebar}>
          <Text style={creativeStyles.sidebarName}>{displayName}</Text>
          {targetRole && (
            <Text style={creativeStyles.sidebarRole}>{targetRole}</Text>
          )}

          {sideSections.map((section, idx) => (
            <View key={idx} style={creativeStyles.sidebarSection}>
              <Text style={creativeStyles.sidebarSectionTitle}>
                {section.title}
              </Text>

              {section.type === "skills" ? (
                <View style={{ gap: 3 }}>
                  {section.content.map((skill, skillIdx) => (
                    <Text key={skillIdx} style={creativeStyles.sidebarSkillTag}>
                      {skill.replace(/^[-•]\s*/, "")}
                    </Text>
                  ))}
                </View>
              ) : (
                section.content.map((item, itemIdx) => (
                  <Text key={itemIdx} style={creativeStyles.sidebarItem}>
                    {item.startsWith("-") || item.startsWith("•")
                      ? item.replace(/^[-•]\s*/, "")
                      : item}
                  </Text>
                ))
              )}
            </View>
          ))}
        </View>

        {/* White Main Area */}
        <View style={creativeStyles.mainArea}>
          {mainSections.map((section, idx) => (
            <View key={idx} style={creativeStyles.mainSection}>
              {section.title && (
                <Text style={creativeStyles.mainSectionTitle}>
                  {section.title}
                </Text>
              )}

              {section.type === "summary" && section.content.length > 0 && (
                <Text style={creativeStyles.summary}>
                  {section.content.join(" ")}
                </Text>
              )}

              {section.entries?.map((entry, entryIdx) => (
                <View key={entryIdx} style={creativeStyles.entryContainer}>
                  <View style={creativeStyles.entryHeader}>
                    <Text style={creativeStyles.entryTitle}>{entry.title}</Text>
                    {entry.date && (
                      <Text style={creativeStyles.entryDate}>{entry.date}</Text>
                    )}
                  </View>
                  {entry.subtitle && (
                    <Text style={creativeStyles.entrySubtitle}>
                      {entry.subtitle}
                    </Text>
                  )}
                  {entry.description && (
                    <Text style={creativeStyles.entryDescription}>
                      {entry.description}
                    </Text>
                  )}
                  {entry.bullets && entry.bullets.length > 0 && (
                    <View style={creativeStyles.bulletList}>
                      {entry.bullets.map((bullet, bulletIdx) => (
                        <View key={bulletIdx} style={creativeStyles.bulletItem}>
                          <Text style={creativeStyles.bulletDot}>•</Text>
                          <Text style={creativeStyles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {!section.entries &&
                section.type !== "summary" &&
                section.content.length > 0 && (
                  <View style={creativeStyles.bulletList}>
                    {section.content.map((item, itemIdx) => (
                      <View key={itemIdx} style={creativeStyles.bulletItem}>
                        <Text style={creativeStyles.bulletDot}>•</Text>
                        <Text style={creativeStyles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// EXECUTIVE TEMPLATE (Dark navy banner + gold accents)
// ============================================

const executiveColors = {
  primary: "#1a1a2e",
  secondary: "#333333",
  accent: "#d4a853",
  muted: "#666666",
  border: "#d4a853",
  background: "#ffffff",
  bannerBg: "#1a1a2e",
};

const executiveStyles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 9,
    color: executiveColors.secondary,
    backgroundColor: executiveColors.background,
  },
  banner: {
    backgroundColor: executiveColors.bannerBg,
    paddingHorizontal: 32,
    paddingVertical: 18,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 2,
  },
  role: {
    fontSize: 10,
    color: executiveColors.accent,
    letterSpacing: 1,
  },
  body: {
    paddingHorizontal: 32,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: executiveColors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: executiveColors.accent,
  },
  entryContainer: {
    marginBottom: 7,
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
    color: executiveColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: executiveColors.accent,
    fontWeight: 600,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: executiveColors.muted,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: executiveColors.secondary,
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: executiveColors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: executiveColors.secondary,
    lineHeight: 1.35,
  },
  summary: {
    fontSize: 9,
    color: executiveColors.secondary,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 3,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillTag: {
    fontSize: 7.5,
    color: executiveColors.primary,
    backgroundColor: "#f5f0e6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: executiveColors.accent,
  },
  textContent: {
    fontSize: 8,
    color: executiveColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentExecutive({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";
  const allSections = sections.filter((s) => s.type !== "other");

  return (
    <Document>
      <Page size="A4" style={executiveStyles.page}>
        <View style={executiveStyles.banner}>
          <Text style={executiveStyles.name}>{displayName}</Text>
          {targetRole && (
            <Text style={executiveStyles.role}>{targetRole}</Text>
          )}
        </View>

        <View style={executiveStyles.body}>
          {allSections.map((section, idx) => (
            <View key={idx} style={executiveStyles.section}>
              {section.title && (
                <Text style={executiveStyles.sectionTitle}>{section.title}</Text>
              )}
              {section.type === "summary" && section.content.length > 0 && (
                <Text style={executiveStyles.summary}>
                  {section.content.join(" ")}
                </Text>
              )}
              {section.type === "skills" && (
                <View style={executiveStyles.skillsGrid}>
                  {section.content.map((skill, skillIdx) => (
                    <Text key={skillIdx} style={executiveStyles.skillTag}>
                      {skill.replace(/^[-•]\s*/, "")}
                    </Text>
                  ))}
                </View>
              )}
              {section.entries?.map((entry, entryIdx) => (
                <View key={entryIdx} style={executiveStyles.entryContainer}>
                  <View style={executiveStyles.entryHeader}>
                    <Text style={executiveStyles.entryTitle}>{entry.title}</Text>
                    {entry.date && (
                      <Text style={executiveStyles.entryDate}>{entry.date}</Text>
                    )}
                  </View>
                  {entry.subtitle && (
                    <Text style={executiveStyles.entrySubtitle}>{entry.subtitle}</Text>
                  )}
                  {entry.description && (
                    <Text style={executiveStyles.entryDescription}>
                      {entry.description}
                    </Text>
                  )}
                  {entry.bullets && entry.bullets.length > 0 && (
                    <View style={executiveStyles.bulletList}>
                      {entry.bullets.map((bullet, bulletIdx) => (
                        <View key={bulletIdx} style={executiveStyles.bulletItem}>
                          <Text style={executiveStyles.bulletDot}>•</Text>
                          <Text style={executiveStyles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {!section.entries &&
                section.type !== "summary" &&
                section.type !== "skills" &&
                section.content.length > 0 && (
                  <View>
                    {section.content.map((item, itemIdx) => (
                      <Text key={itemIdx} style={executiveStyles.textContent}>
                        {item.startsWith("-") || item.startsWith("•")
                          ? item.replace(/^[-•]\s*/, "• ")
                          : item}
                      </Text>
                    ))}
                  </View>
                )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// MINIMAL TEMPLATE (Ultra-clean Swiss design)
// ============================================

const minimalColors = {
  primary: "#111111",
  secondary: "#444444",
  muted: "#888888",
  border: "#dddddd",
  background: "#ffffff",
};

const minimalStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Open Sans",
    fontSize: 9,
    color: minimalColors.secondary,
    backgroundColor: minimalColors.background,
  },
  header: {
    marginBottom: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: 400,
    color: minimalColors.primary,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  role: {
    fontSize: 9,
    color: minimalColors.muted,
    letterSpacing: 1,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: minimalColors.border,
    marginBottom: 10,
    marginTop: 5,
  },
  section: {
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: minimalColors.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 5,
  },
  entryContainer: {
    marginBottom: 7,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: minimalColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: minimalColors.muted,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 8,
    color: minimalColors.muted,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: minimalColors.secondary,
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  bulletDash: {
    width: 12,
    fontSize: 8,
    color: minimalColors.muted,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: minimalColors.secondary,
    lineHeight: 1.35,
  },
  summary: {
    fontSize: 8.5,
    color: minimalColors.secondary,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  skillLine: {
    fontSize: 8,
    color: minimalColors.secondary,
    lineHeight: 1.5,
  },
  textContent: {
    fontSize: 8,
    color: minimalColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentMinimal({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";
  const allSections = sections.filter((s) => s.type !== "other");

  return (
    <Document>
      <Page size="A4" style={minimalStyles.page}>
        <View style={minimalStyles.header}>
          <Text style={minimalStyles.name}>{displayName}</Text>
          {targetRole && (
            <Text style={minimalStyles.role}>{targetRole}</Text>
          )}
        </View>
        <View style={minimalStyles.divider} />

        {allSections.map((section, idx) => (
          <View key={idx} style={minimalStyles.section}>
            {section.title && (
              <Text style={minimalStyles.sectionTitle}>{section.title}</Text>
            )}
            {section.type === "summary" && section.content.length > 0 && (
              <Text style={minimalStyles.summary}>
                {section.content.join(" ")}
              </Text>
            )}
            {section.type === "skills" && (
              <Text style={minimalStyles.skillLine}>
                {section.content.map((s) => s.replace(/^[-•]\s*/, "")).join(", ")}
              </Text>
            )}
            {section.entries?.map((entry, entryIdx) => (
              <View key={entryIdx} style={minimalStyles.entryContainer}>
                <View style={minimalStyles.entryHeader}>
                  <Text style={minimalStyles.entryTitle}>{entry.title}</Text>
                  {entry.date && (
                    <Text style={minimalStyles.entryDate}>{entry.date}</Text>
                  )}
                </View>
                {entry.subtitle && (
                  <Text style={minimalStyles.entrySubtitle}>{entry.subtitle}</Text>
                )}
                {entry.description && (
                  <Text style={minimalStyles.entryDescription}>
                    {entry.description}
                  </Text>
                )}
                {entry.bullets && entry.bullets.length > 0 && (
                  <View style={minimalStyles.bulletList}>
                    {entry.bullets.map((bullet, bulletIdx) => (
                      <View key={bulletIdx} style={minimalStyles.bulletItem}>
                        <Text style={minimalStyles.bulletDash}>{"\u2013"}</Text>
                        <Text style={minimalStyles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {!section.entries &&
              section.type !== "summary" &&
              section.type !== "skills" &&
              section.content.length > 0 && (
                <View>
                  {section.content.map((item, itemIdx) => (
                    <Text key={itemIdx} style={minimalStyles.textContent}>
                      {item.startsWith("-") || item.startsWith("•")
                        ? item.replace(/^[-•]\s*/, "")
                        : item}
                    </Text>
                  ))}
                </View>
              )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ============================================
// DIAMOND TEMPLATE (Emerald sidebar + white main)
// ============================================

const diamondColors = {
  sidebar: "#064e3b",
  sidebarText: "#d1fae5",
  sidebarAccent: "#34d399",
  primary: "#064e3b",
  secondary: "#333333",
  accent: "#059669",
  muted: "#666666",
  border: "#d1fae5",
  background: "#ffffff",
};

const diamondStyles = StyleSheet.create({
  page: {
    fontFamily: "Open Sans",
    fontSize: 9,
    flexDirection: "row",
  },
  sidebar: {
    width: 165,
    backgroundColor: diamondColors.sidebar,
    padding: 18,
    paddingTop: 28,
    color: diamondColors.sidebarText,
  },
  mainArea: {
    flex: 1,
    padding: 25,
    paddingLeft: 22,
    backgroundColor: diamondColors.background,
    color: diamondColors.secondary,
  },
  sidebarName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 3,
  },
  sidebarRole: {
    fontSize: 8,
    color: diamondColors.sidebarAccent,
    marginBottom: 14,
  },
  sidebarSection: {
    marginBottom: 10,
  },
  sidebarSectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: diamondColors.sidebarAccent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#065f46",
  },
  sidebarItem: {
    fontSize: 7.5,
    color: diamondColors.sidebarText,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  sidebarSkillTag: {
    fontSize: 7.5,
    color: "#ffffff",
    backgroundColor: "#065f46",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 2,
  },
  mainSection: {
    marginBottom: 10,
  },
  mainSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: diamondColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: diamondColors.accent,
  },
  entryContainer: {
    marginBottom: 8,
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
    color: diamondColors.primary,
    flex: 1,
  },
  entryDate: {
    fontSize: 8,
    color: diamondColors.accent,
    fontWeight: 600,
    textAlign: "right",
  },
  entrySubtitle: {
    fontSize: 9,
    color: diamondColors.muted,
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 8,
    color: diamondColors.secondary,
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: diamondColors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: diamondColors.secondary,
    lineHeight: 1.35,
  },
  summary: {
    fontSize: 9,
    color: diamondColors.secondary,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 3,
  },
  textContent: {
    fontSize: 8,
    color: diamondColors.secondary,
    lineHeight: 1.4,
  },
});

function CVDocumentDiamond({ content, targetRole, userName }: PDFDownloadButtonProps) {
  const sections = parseCV(content);
  const displayName = userName || sections[0]?.content?.[0] || targetRole || "CV";

  const mainSections = sections.filter(
    (s) =>
      s.type === "summary" ||
      s.type === "experience" ||
      s.type === "education" ||
      s.type === "projects",
  );
  const sideSections = sections.filter(
    (s) =>
      s.type === "skills" ||
      s.type === "certifications" ||
      s.type === "languages",
  );

  return (
    <Document>
      <Page size="A4" style={diamondStyles.page}>
        {/* Emerald Sidebar */}
        <View style={diamondStyles.sidebar}>
          <Text style={diamondStyles.sidebarName}>{displayName}</Text>
          {targetRole && (
            <Text style={diamondStyles.sidebarRole}>{targetRole}</Text>
          )}

          {sideSections.map((section, idx) => (
            <View key={idx} style={diamondStyles.sidebarSection}>
              <Text style={diamondStyles.sidebarSectionTitle}>
                {section.title}
              </Text>

              {section.type === "skills" ? (
                <View style={{ gap: 3 }}>
                  {section.content.map((skill, skillIdx) => (
                    <Text key={skillIdx} style={diamondStyles.sidebarSkillTag}>
                      {skill.replace(/^[-•]\s*/, "")}
                    </Text>
                  ))}
                </View>
              ) : (
                section.content.map((item, itemIdx) => (
                  <Text key={itemIdx} style={diamondStyles.sidebarItem}>
                    {item.startsWith("-") || item.startsWith("•")
                      ? item.replace(/^[-•]\s*/, "")
                      : item}
                  </Text>
                ))
              )}
            </View>
          ))}
        </View>

        {/* White Main Area */}
        <View style={diamondStyles.mainArea}>
          {mainSections.map((section, idx) => (
            <View key={idx} style={diamondStyles.mainSection}>
              {section.title && (
                <Text style={diamondStyles.mainSectionTitle}>
                  {section.title}
                </Text>
              )}

              {section.type === "summary" && section.content.length > 0 && (
                <Text style={diamondStyles.summary}>
                  {section.content.join(" ")}
                </Text>
              )}

              {section.entries?.map((entry, entryIdx) => (
                <View key={entryIdx} style={diamondStyles.entryContainer}>
                  <View style={diamondStyles.entryHeader}>
                    <Text style={diamondStyles.entryTitle}>{entry.title}</Text>
                    {entry.date && (
                      <Text style={diamondStyles.entryDate}>{entry.date}</Text>
                    )}
                  </View>
                  {entry.subtitle && (
                    <Text style={diamondStyles.entrySubtitle}>
                      {entry.subtitle}
                    </Text>
                  )}
                  {entry.description && (
                    <Text style={diamondStyles.entryDescription}>
                      {entry.description}
                    </Text>
                  )}
                  {entry.bullets && entry.bullets.length > 0 && (
                    <View style={diamondStyles.bulletList}>
                      {entry.bullets.map((bullet, bulletIdx) => (
                        <View key={bulletIdx} style={diamondStyles.bulletItem}>
                          <Text style={diamondStyles.bulletDot}>•</Text>
                          <Text style={diamondStyles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {!section.entries &&
                section.type !== "summary" &&
                section.content.length > 0 && (
                  <View style={diamondStyles.bulletList}>
                    {section.content.map((item, itemIdx) => (
                      <View key={itemIdx} style={diamondStyles.bulletItem}>
                        <Text style={diamondStyles.bulletDot}>•</Text>
                        <Text style={diamondStyles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// TEMPLATE SELECTOR & DOWNLOAD BUTTON
// ============================================

function getDocumentComponent(
  templateId: PDFTemplateId,
  props: PDFDownloadButtonProps,
) {
  switch (templateId) {
    case "classic":
      return <CVDocumentClassic {...props} />;
    case "creative":
      return <CVDocumentCreative {...props} />;
    case "executive":
      return <CVDocumentExecutive {...props} />;
    case "minimal":
      return <CVDocumentMinimal {...props} />;
    case "diamond":
      return <CVDocumentDiamond {...props} />;
    case "modern":
    default:
      return <CVDocumentModern {...props} />;
  }
}

export default function PDFDownloadButton({
  content,
  targetRole,
  atsScore,
  userName,
  templateId = "modern",
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const doc = getDocumentComponent(templateId, {
        content,
        targetRole,
        atsScore,
        userName,
        templateId,
      });

      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileName = targetRole
        ? `cv-${targetRole.toLowerCase().replace(/\s+/g, "-")}-${templateId}-${new Date().toISOString().split("T")[0]}.pdf`
        : `cv-optimized-${templateId}-${new Date().toISOString().split("T")[0]}.pdf`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="btn-primary flex-1 flex items-center justify-center gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          PDF Oluşturuluyor...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          PDF Olarak İndir
        </>
      )}
    </button>
  );
}
