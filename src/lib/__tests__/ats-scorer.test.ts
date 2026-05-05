import { describe, it, expect } from "vitest";
import { scoreCV } from "../ats-scorer";

describe("scoreCV", () => {
  const perfectCV = `
ÖZET
Deneyimli yazılım geliştirici. 5 yıl Full Stack geliştirme deneyimine sahibim.

EĞİTİM
İstanbul Teknik Üniversitesi, Bilgisayar Mühendisliği, 2018-2022

DENEYİM
Senior Developer - ABC Teknoloji
- React ve Node.js ile büyük ölçekli uygulamalar geliştirdim
- Takım liderliği yaparak 5 kişilik ekibi yönettim
- Performans optimizasyonu ile yükleme süresini %40 azalttım
- CI/CD pipeline kurarak deploy süresini 2 saatten 15 dakikaya indirdim
- Mikro servis mimarisi ile sistemi yeniden tasarladım

Junior Developer - XYZ Yazılım
- REST API'ler oluşturdum ve mevcut sistemleri geliştirdim
- Veritabanı optimizasyonu ile sorgu performansını artırdım
- Unit test yazarak kod kalitesini %95 seviyesine çıkardım

BECERİLER
Teknik: React, TypeScript, Node.js, PostgreSQL, Docker, AWS
Soft: Takım çalışması, iletişim, problem çözme

İLETİŞİM
mustafa@email.com
+90 555 123 4567
`;

  it("should score a perfect CV above 70", () => {
    const result = scoreCV(perfectCV, {
      matchedKeywords: ["React", "Node.js"],
      addedKeywords: ["TypeScript"],
    });
    expect(result.total).toBeGreaterThanOrEqual(70);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("should return low score for empty CV", () => {
    const result = scoreCV("");
    expect(result.total).toBeLessThanOrEqual(40);
    expect(result.breakdown.sectionHeaderScore).toBe(0);
    expect(result.breakdown.bulletStructureScore).toBe(0);
    expect(result.breakdown.lengthScore).toBe(0);
  });

  it("should handle Turkish characters in headers", () => {
    const turkishCV = `
ÖZET
Yazılım mühendisiyim.

EĞİTİM
Üniversite, 2020

İŞ DENEYİMİ
- Uygulama geliştirdim
- Veritabanı tasarladım

YETENEKLER
Java, Python

ornek@email.com
5551234567
`;
    const result = scoreCV(turkishCV);
    expect(result.breakdown.sectionHeaderScore).toBeGreaterThan(0);
  });

  it("should deduct for HTML tags", () => {
    const htmlCV = `
<div>
  <p>Deneyimli geliştirici</p>
  <table><tr><td>React</td></tr></table>
  <img src="photo.jpg" />
  <br/>
</div>
ornek@email.com
5551234567
`;
    const result = scoreCV(htmlCV);
    expect(result.breakdown.formattingScore).toBeLessThan(20);
    expect(result.issues).toContain("HTML etiketleri tespit edildi");
  });

  it("should award high score for bullet points with action verbs", () => {
    const bulletCV = `
DENEYİM
- Geliştirdim ve optimize ettim
- Yönettim ve koordine ettim
- Tasarladım ve uyguladım
- Yürüttüm ve başardım
- Artırdım ve azalttım
ornek@email.com
5551234567
`;
    const result = scoreCV(bulletCV);
    expect(result.breakdown.bulletStructureScore).toBeGreaterThanOrEqual(12);
  });

  it("should detect quantified results", () => {
    const quantCV = `
DENEYİM
- Satışları %30 artırdım
- Maliyetleri 50.000 TL azalttım
- 10 kişilik takımı yönettim
- 6 ay içinde projeyi tamamladım
- Kullanıcı sayısını 1000+ artırdım
ornek@email.com
5551234567
`;
    const result = scoreCV(quantCV);
    expect(result.breakdown.quantifiedResultsScore).toBe(15);
  });

  it("should penalize very short CV", () => {
    const result = scoreCV("Kısa CV");
    expect(result.breakdown.lengthScore).toBeLessThanOrEqual(5);
  });

  it("should penalize very long CV", () => {
    const longCV = "kelime ".repeat(900) + "\norenk@email.com\n5551234567";
    const result = scoreCV(longCV);
    expect(result.breakdown.lengthScore).toBeLessThanOrEqual(5);
    expect(result.issues).toContain("CV çok uzun");
  });

  it("should score ideal length CV highly", () => {
    const words = "deneyim geliştirme proje ".repeat(120);
    const idealCV = `${words}\norenk@email.com\n5551234567`;
    const result = scoreCV(idealCV);
    expect(result.breakdown.lengthScore).toBe(15);
  });

  it("should handle keyword matching with Turkish case", () => {
    const cvText = "React ve node.js ile geliştirme yapıyorum";
    const result = scoreCV(cvText, {
      matchedKeywords: ["react", "Node.JS"],
      addedKeywords: [],
    });
    expect(result.breakdown.keywordScore).toBe(20);
  });

  it("should return correct breakdown structure", () => {
    const result = scoreCV("test cv");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("breakdown");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("suggestions");
    expect(result.breakdown).toHaveProperty("keywordScore");
    expect(result.breakdown).toHaveProperty("sectionHeaderScore");
    expect(result.breakdown).toHaveProperty("bulletStructureScore");
    expect(result.breakdown).toHaveProperty("quantifiedResultsScore");
    expect(result.breakdown).toHaveProperty("lengthScore");
    expect(result.breakdown).toHaveProperty("formattingScore");
  });

  it("should give default keyword score when no keywords provided", () => {
    const result = scoreCV("test cv content");
    expect(result.breakdown.keywordScore).toBe(10);
  });

  it("should detect missing sections", () => {
    const result = scoreCV("Just some random text without proper sections");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should not exceed 100 total", () => {
    const result = scoreCV(perfectCV, {
      matchedKeywords: ["React", "Node.js", "TypeScript", "Docker", "AWS"],
      addedKeywords: ["Kubernetes", "GraphQL"],
    });
    expect(result.total).toBeLessThanOrEqual(100);
  });
});
