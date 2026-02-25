"use client";

import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// PDF Stilleri
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.6,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
  scoreBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 10,
    color: "#64748b",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
});

interface CVPDFProps {
  content: string;
  targetRole?: string;
  atsScore?: { before: number; after: number };
}

// CV PDF Bileşeni
function CVDocument({ content, targetRole, atsScore }: CVPDFProps) {
  const sections = parseCV(content);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {targetRole ? `${targetRole} - Optimize Edilmiş CV` : "Optimize Edilmiş CV"}
          </Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString("tr-TR")}
          </Text>
        </View>

        {/* ATS Score */}
        {atsScore && (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>
              ATS Uyumluluk Skoru: <Text style={styles.scoreValue}>{atsScore.after}%</Text>
              {" "}(önceki: {atsScore.before}%)
            </Text>
          </View>
        )}

        {/* CV Content */}
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.bulletPoint}>
                {section.isBullet && <Text style={styles.bullet}>•</Text>}
                <Text style={section.isBullet ? styles.bulletText : styles.content}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}

      </Page>
    </Document>
  );
}

// CV içeriğini bölümlere ayır
function parseCV(content: string): { title: string; items: string[]; isBullet: boolean }[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const sections: { title: string; items: string[]; isBullet: boolean }[] = [];
  let currentSection: { title: string; items: string[]; isBullet: boolean } | null = null;

  const sectionHeaders = [
    "ÖZET",
    "SUMMARY",
    "DENEYİM",
    "EXPERIENCE",
    "EĞİTİM",
    "EDUCATION",
    "BECERİLER",
    "SKILLS",
    "SERTİFİKALAR",
    "CERTIFICATIONS",
    "PROJELER",
    "PROJECTS",
  ];

  for (const line of lines) {
    const upperLine = line.toUpperCase().trim();
    const isHeader = sectionHeaders.some(
      (header) => upperLine === header || upperLine.startsWith(header + ":")
    );

    if (isHeader) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.trim().replace(":", ""),
        items: [],
        isBullet: false,
      };
    } else if (currentSection) {
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
      if (isBullet) {
        currentSection.isBullet = true;
        currentSection.items.push(line.trim().replace(/^[-•]\s*/, ""));
      } else {
        currentSection.items.push(line.trim());
      }
    } else {
      // İlk bölüm öncesi içerik
      if (!sections.length) {
        sections.push({
          title: "",
          items: [line.trim()],
          isBullet: false,
        });
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// PDF İndirme Hook'u
export function usePDFDownload() {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async (
    content: string,
    filename: string = "optimized-cv",
    options?: { targetRole?: string; atsScore?: { before: number; after: number } }
  ) => {
    setIsGenerating(true);

    try {
      const blob = await pdf(
        <CVDocument
          content={content}
          targetRole={options?.targetRole}
          atsScore={options?.atsScore}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { downloadPDF, isGenerating };
}

export { CVDocument };
