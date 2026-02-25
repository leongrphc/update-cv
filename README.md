# CV Optimizer

İş başvurusu yaparken CV'ni düzenlemeye yardımcı olan bir uygulama.

## Ne işe yarıyor?

PDF olarak CV'ni yükleyip, başvurmak istediğin iş ilanını yapıştırıyorsun. Uygulama CV'ni o ilana göre düzenliyor. Yani ilanda aranan kelimeleri, becerileri CV'ne uygun şekilde yerleştiriyor. Böylece ATS denen otomatik eleme sistemlerinden geçme şansın artıyor.

## Neler yapabilirsin?

- **CV Optimizasyonu**: CV'ni hedef ilana göre uyarla
- **Ön Yazı Oluşturma**: İlana özel kapak mektubu yaz
- **Eksik Beceri Analizi**: Hangi becerilerini geliştirmen gerektiğini gör
- **Mülakat Simülasyonu**: Pozisyona özel sorularla pratik yap
- **LinkedIn Entegrasyonu**: LinkedIn profilini CV'nle birleştir

## Önemli not

Uygulama yalan bilgi eklemiyor. Sadece mevcut deneyimlerini daha iyi ifade etmene yardımcı oluyor.

## Çalıştırmak için

```
npm install
npm run db:push
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine git.

## Ayarlar

`.env.local` dosyası oluşturup API anahtarlarını eklemen gerekiyor:

```
GOOGLE_GENERATIVE_AI_API_KEY=...
# veya
OPENAI_API_KEY=...

DATABASE_URL="file:./dev.db"
JWT_SECRET=rastgele-bir-sifre
```
