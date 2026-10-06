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
- **PDF CV Düzenleme**: Mevcut PDF'yi kontrol ederek form alanlarına aktar, düzenle, altı şablondan birini seç ve gerçek PDF önizlemesiyle indir.

## Önemli not

AI'dan mevcut bilgileri koruması istenir; otomatik çıkarım ve öneriler hata içerebilir. Tarihleri, iletişim bilgilerini ve başarıları kaynak CV ile karşılaştırın.

PDF düzenleme için **CV Oluştur → PDF CV yükle → Kontrol ettim, alanlara aktar** akışını kullanın. İçe aktarma mevcut formu otomatik değiştirmez, geri alınabilir ve eski CV kaydının üzerine yazmaz. Son adımda gerçek PDF görüntülenir; indirilen dosya önizlemeyle aynıdır.

Seçilebilir metin içeren, en fazla 5 MB PDF desteklenir. Taranmış belgelerde önce OCR gerekir. PDF metni yapılandırılan AI sağlayıcısına gönderilir. Orijinal PDF tasarımı korunmaz; seçtiğiniz şablon uygulanır. Proje/yayın gibi editörde alanı olmayan bölümler kaynak metinde gösterilir ve yeni PDF'ye otomatik eklenmez. Kaydetmeden ayrılınca veya sayfayı yenileyince kaydedilmemiş düzenlemeler ve içe aktarma incelemesi kaybolabilir. AI bağlantısı için `.env` içinde Google veya OpenAI anahtarı gereklidir.

## Çalıştırmak için

Node.js 22.3 veya üzeri gerekir; CI Node.js 24 kullanır.

```
npm ci
npm run setup
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine git.

## Ayarlar

`npm run setup`, `.env.example` üzerinden `.env` oluşturup rastgele JWT ve cron anahtarları üretir. Mevcut `.env` dosyanızı değiştirmez. AI ve SMTP bilgilerinizi bu dosyaya ekleyin. Prisma CLI ve Next.js aynı ayarları okuyabilir:

```
GOOGLE_GENERATIVE_AI_API_KEY=...
# veya
OPENAI_API_KEY=...

DATABASE_URL="file:./dev.db"
JWT_SECRET=rastgele-bir-sifre
```

Yeni kurulumda `npm run db:setup` boş veritabanını migration dosyalarından oluşturur. Veritabanı dosyaları Git'e eklenmez.

Eski `prisma/dev.db` dosyanız varsa önce yedeğini alın. Eski şemayı migration geçmişine kaydedip güncellemeleri uygulayın:

```sh
npx prisma migrate resolve --applied 20260505000000_baseline
npm run db:setup
```

Bu baselining komutu yalnızca migration geçmişi olmayan eski veritabanları içindir. Güncellemeler CV kayıtlarını korur ve paylaşım alanlarını ekler. Boş ve eski veritabanı yollarını `npm run test:migrations` ile doğrulayabilirsiniz.

Üretimde şifre sıfırlama için `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` ve HTTPS site adresiniz olan `APP_URL` tanımlanmalıdır. SMTP hazır değilse sıfırlama uç noktası 503 döndürür; gönderilmemiş bir e-postayı başarılı göstermez. Geliştirme modunda bağlantı ekranda gösterilir. Token'lar veritabanında SHA-256 hash olarak tutulur; bu güncellemeden önce oluşturulmuş sıfırlama bağlantıları yerine yeni bağlantı istenmelidir.

İş arama için `APIFY_API_TOKEN` gerekir. Bildirim kontrolünü zamanlayıcınızdan `POST /api/cron/check-alerts` adresine `Authorization: Bearer <CRON_SECRET>` başlığıyla çağırın. `CRON_SECRET` olmadan kontrol çalışmaz. API ve giriş istek sınırları süreç belleğinde tutulur; birden fazla sunucuyla dağıtımda paylaşılan bir sayaç deposu kullanılmalıdır.

Her push ve pull request için GitHub Actions lint, test, migration, üretim bağımlılık audit'i, derleme ve çalışan uygulama kontrollerini yürütür. Yerelde aynı akışı `npm run lint`, `npm run test:run`, `npm run test:migrations`, `npm run build` ve `npm run test:smoke` ile doğrulayabilirsiniz. Smoke testi geçici bir veritabanı ve yerel sunucu kullanır; mevcut verilerinizi değiştirmez.
