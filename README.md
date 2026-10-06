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

PDF düzenleme için **CV Oluştur → PDF CV yükle → Kontrol ettim, alanlara aktar** akışını kullanın. İçe aktarma mevcut formu otomatik değiştirmez, geri alınabilir ve eski CV kaydının üzerine yazmaz. Son adımda gerçek PDF uygulama içinde çizilir; masaüstü ve mobilde sayfalar arasında geçebilir, yakınlaştırabilir ve sayfa metnini görüntüleyebilirsiniz. İndirilen dosya önizlemeyle aynıdır.

Seçilebilir metin içeren, en fazla 5 MB PDF desteklenir. AI anahtarı varsa metin sağlayıcıya gönderilerek alanlara ayrılır. Anahtar yoksa PDF metni değiştirilmeden **Kaynak CV** adlı özel bölüme aktarılır; kişisel bilgilerinizi doldurup metni kendiniz düzenleyebilir ve bölümlere ayırabilirsiniz. Proje/yayın/referans gibi bölümler tüm şablonlarda PDF’ye dahil edilir. Taranmış belgelerde önce OCR gerekir; orijinal tasarım yerine seçtiğiniz şablon uygulanır.

Düzenlemeler, kaldığınız adım ve PDF aktarım incelemesi her hesap ve CV için ayrı yerel taslakta saklanır. Taslak seçiciden önceki çalışmalarınızı açabilir, JSON yedeği indirebilir ve yedeği yeni bir CV olarak geri yükleyebilirsiniz. Tarayıcı verilerini silmek yerel taslakları da siler; **Kaydet** ile CV’yi hesabınıza kaydedin. Başka sekmedeki değişiklikle çakışma veya dolu tarayıcı depolaması durumunda uyarı gösterilir.

Altı şablonun renkleri, yazı tipi ve boyutu özelleştirilip CV ile birlikte kaydedilir. Türkçe karakterleri destekleyen Open Sans, Lato ve PT Serif fontları lisanslarıyla uygulamaya dahildir. Deneyim, eğitim ve özel bölümler sıralanabilir.

AI ile özet, deneyim maddesi veya özel bölüm için öneri isteyebilirsiniz. Dil ve başvuracağınız pozisyon önerinin odağını belirler. Mevcut metin, öneri ve uyarılar gösterilir; öneriyi düzenleyip **Öneriyi uygula** ile onaylamadan CV değişmez. Yeni sayı uyarısı tüm yanlış bilgileri tespit etmez; önerileri kaynak bilgilerle karşılaştırın. İstek sırasında metin veya CV bilgileri değişirse eski öneri uygulanamaz. Canlı AI önerileri için Google veya OpenAI anahtarı gerekir.

## Çalıştırmak için

Node.js 22.3 veya üzeri gerekir; CI Node.js 24 kullanır. `npm run dev` ve `npm run build`, PDF.js görüntüleme motorunun aynı sürümdeki worker dosyasını ve Apache lisansını `public/pdfjs` içine otomatik kopyalar. Bu dosyalar CDN gerektirmez.

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

Her push ve pull request için GitHub Actions lint, test, migration, üretim bağımlılık audit'i, derleme ve çalışan uygulama kontrollerini yürütür. Yerelde aynı akışı `npm run lint`, `npm run test:run`, `npm run test:migrations`, `npm run build`, `npm run test:smoke` ve `npm run test:editor` ile doğrulayabilirsiniz. Smoke testi geçici bir veritabanı ve yerel sunucu kullanır; mevcut verilerinizi değiştirmez.

## Cloudflare canlı yayın

Canlı adres `https://cv.mozkan.com.tr`; mevcut Worker `cv-mozkan`, D1 veritabanı `cv-db` ve veritabanı binding'i `DB` kullanılır. Yerel geliştirme SQLite ile, Cloudflare istekleri Prisma D1 adaptörü ile çalışır.

```sh
npm ci
npm run build:cloudflare
npm run db:cloudflare:check
npm run db:cloudflare:migrate
npx opennextjs-cloudflare deploy
node scripts/check-cloudflare.mjs https://cv.mozkan.com.tr
```

Wrangler hesabına giriş yapılmış olmalıdır. Veritabanı güncellemesi repodaki eksik tablo, indeks ve sütunları ekler; eski native SQLite kayıtlarının sayısal DateTime alanlarını D1 istemcisinin okuyabildiği UTC ISO tarih biçimine çevirir. Tarihin milisaniyesi korunur; mevcut ISO tarihler, şifreler ve CV içeriği değiştirilmez, kayıt silinmez. Değişiklikten önce `.agent/cloudflare/` altında SQL yedeği alır ve güncellemeyi doğrular. Bu klasör kişisel veriler içerebilir; Git'e gönderilmez. Aynı komut tekrar çalıştırılabilir. Standart Prisma migration komutları yalnızca yerel SQLite içindir.

OpenNext yerel `.env` değerlerini derlemeye kopyalar; `build:cloudflare` sunucu değerlerini paketten çıkarır. Canlı `JWT_SECRET`, AI, Apify ve SMTP anahtarları Cloudflare Worker secrets olarak tutulmalıdır. Mevcut secrets ve alan adı korunur. `APP_URL` canlı HTTPS adresidir. Yerel Worker önizlemesinde `.dev.vars` içine yalnızca test anahtarlarını koyun, `node scripts/migrate-cloudflare.mjs --apply` ile yerel D1'i hazırlayın ve `npm run preview:cloudflare` çalıştırın.

`check-cloudflare.mjs` gerçek PDF metin çıkarımı, font/worker dosyaları, D1 sorgusu ve anonim erişim sınırlarını doğrular; hesap veya CV oluşturmaz. Önce yerel Worker URL'sinde, ardından canlı adreste çalıştırın. Yayın sürümleri `npx wrangler deployments list --name cv-mozkan` ile görülebilir; uygulama geri alma `npx wrangler rollback <version-id> --name cv-mozkan` ile yapılabilir. Veritabanındaki ek alanlar eski uygulama sürümüyle uyumludur.
