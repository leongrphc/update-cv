# Update CV — Güncel durum

6 Ekim 2026. Proje mevcut klasöre klonlandı; geliştirmeler sırayla commit edilerek `main` dalına gönderildi.

Cloudflare canlı yayın altyapısı repoya eklendi: `cv.mozkan.com.tr` → `cv-mozkan` Worker → `cv-db` D1. İstek başına Prisma WASM istemcisi, D1 üzerinde atomik şifre sıfırlama, Worker ortamında PDF metin çıkarımı ve sunucu anahtarlarını derleme paketinden çıkarma kontrolü hazır. Veritabanı güncellemesi SQL yedeği alır; mevcut kayıtları koruyarak eksik tabloları, indeksleri ve CV alanlarını ekler. Yayın ve kontrol komutları README'de bulunur.

Cloudflare doğrulaması: 25 dosyada 155 test; lint, yerel migration ve native uygulama kontrolleri geçti. OpenNext Worker derlendi; gerçek yerel Worker/D1 ortamında oturum, CV kaydetme/güncelleme, tema/özel bölüm kalıcılığı, PDF içe aktarma ve masaüstü/mobil gerçek PDF çizimi doğrulandı. Üretim bağımlılık audit'i 0 açık bildiriyor. Canlı AI anahtarları Worker secrets olarak mevcut; değerleri okunmadı veya değiştirilmedi.

Profesyonel PDF CV düzenleme akışı: **PDF yükle → kaynak metni kontrol et → alanlara aktar → içeriği ve özel bölümleri düzenle → şablon/tema seç → gerçek PDF önizlemesi → indir/kaydet**. İçe aktarma onay gerektirir ve geri alınabilir; önceki CV kaydı korunur. AI anahtarı olmadan PDF metni tek bir düzenlenebilir özel bölüme aktarılır; kişisel bilgiler manuel doldurulur. AI varsa otomatik alan çıkarımı kullanılır. Projeler, yayınlar ve referanslar özel bölüm olarak saklanır ve altı PDF şablonuna dahil edilir.

Tamamlanan editör geliştirmeleri:

- `55cf92c`: Altı şablonda renk, font ve boyut özelleştirme; tema ayarlarını CV ile kaydetme ve yeniden açma. Open Sans, Lato ve PT Serif fontları yerel ve lisanslıdır.
- `d58e308`: Hesap ve CV bazında otomatik yerel taslak, kaldığınız adımı kurtarma, PDF incelemesini ve geri alma bilgisini koruma; taslak seçici, kopya oluşturma ve JSON yedek geri yükleme. Kaydedilmiş CV yalnızca sahibine ait API üzerinden açılır.
- `ebdc780`: Düzenlenebilir ve sıralanabilir özel bölümler; veritabanı, paylaşım ve altı şablonda içerik koruma; AI anahtarı olmadan PDF aktarımı; deneyim/eğitim sıralaması ve yıl içeren tarihlerin düzenlenmesi.
- `932fe77`: AI öneri incelemesi: Mevcut metni değiştirmeden özet, deneyim maddesi ve özel bölüm önerisi; karşılaştırma, öneriyi düzenleme, alternatif seçimi, açık uygulama/reddetme. Dil ve hedef pozisyon isteğe dahil edilir. Yeni sayısal iddialar uyarılır; iptal edilen veya metin değiştikten sonra gelen eski yanıtlar uygulanamaz. Kaydedilmiş PDF’yi açmak daha yeni düzenleme taslağını değiştirmez.

- `bbc0218`: Mobil PDF önizlemesi: Tarayıcının yerleşik PDF desteğine bağlı olmadan uygulama içinde sayfa çizimi, sayfa geçişi, yakınlaştırma ve PDF metni görüntüleme. Worker ve lisans dosyaları yerel derlemede aynı sürümden kopyalanır. İndirilen dosya değişmez. [PDF.js resmî örneği](https://mozilla.github.io/pdf.js/examples/) temel alınmıştır.

Doğrulama: 22 test dosyasında 143 test geçti. Lint, üretim derlemesi, boş/eski veritabanı migration kontrolleri ve üretim bağımlılık audit’i başarılı; üretim audit’i 0 açık bildiriyor. Masaüstü ve mobil tarayıcı kontrolleri PDF içe aktarma/onay/geri alma, taslak kurtarma ve hesap ayrımı, JSON yedek, depolama hataları, tema ve özel bölüm kalıcılığı, AI önerisi onayı, PDF yeniden deneme ve önizleme/indirme eşitliğini kapsar. Altı şablonda çok sayfalı deneyim ve özel bölüm metni Türkçe olarak aranabilir kalır. API ve SDK testlerinde sağlayıcı cevapları sabit verilerle sağlandı; canlı AI çağrısı anahtar olmadığı için doğrulanmadı.

Tarih gösterimi altı PDF şablonunda ve paylaşım sayfasında birleştirildi. Yalnızca yıl içeren tarihler korunur; bitiş tarihi yoksa gereksiz ayırıcı veya devam ediyor varsayımı eklenmez. Belirsiz tarih metinleri değiştirilmez.

Sınırlar: Taranmış belgeler için OCR gerekir. Orijinal PDF’nin tasarımı birebir değiştirilmez; seçilen şablon kullanılır. Yerel taslaklar tarayıcı verileriyle silinebilir; kalıcı hesap kaydı veya JSON yedeği kullanılmalıdır. Sayısal uyarılar tüm yanlış iddiaları bulmaz; AI önerileri kullanıcı tarafından kontrol edilmelidir.

CV oluşturma ve optimizasyon, 6 PDF şablonu, ATS puanı, ön yazı, mülakat, LinkedIn aktarımı, Apify iş arama, bildirimler ve CV paylaşımı mevcut. Altyapı Next.js 15.5.27, React 19, AI SDK 6, TypeScript ve Prisma/SQLite olarak güncellendi.

Tamamlanan geliştirmeler:

| Commit | Değişiklik |
| --- | --- |
| `14f889d` | CV kaydında özet, konum, tarihler, dil ve sertifika bilgilerinin silinmesi düzeltildi. |
| `a97d59c` | Verileri koruyan migration sistemi ve paylaşım sütunları eklendi; veritabanı Git takibinden çıkarıldı. |
| `8979f8d` | Ücretli API uçlarına oturum kontrolü, kullanıcı bazlı istek sınırı, giriş denemesi sınırı ve zorunlu cron anahtarı eklendi. |
| `49cb2a2` | Next.js, React ve PDF renderer güncellendi; paylaşım sayfası yeni Next.js API'sine uyarlandı. |
| `17f1363` | AI SDK ve CSS bağımlılıkları güncellendi; Google JSON çıktısı, OpenAI JSON modu ve sohbet akışı test edildi. |
| `dc13451` | SMTP şifre sıfırlama e-postaları, hash olarak saklanan token'lar ve tek kullanım kontrolü eklendi. |
| `d8eea0a` | Mülakat oturumları kullanıcıya bağlandı; başka kullanıcıların oturumunu okuma ve değerlendirme engellendi. |
| `bdec5cf` | CV düzenleme artık aynı kaydı güncelliyor; CV dili düzenleme, indirme ve paylaşımda korunuyor. |
| `6280e79` | Güvenli yerel kurulum, GitHub Actions, çalışan uygulama kontrolleri ve uyarısız lint eklendi. |

Ayrıca `npm run setup` ile mevcut ayarları koruyan, rastgele yerel anahtarlar üreten kurulum ve GitHub Actions doğrulama akışı eklendi. Actions paketleri güncel v7 sürümlerine taşındı ve CI ortamı Ubuntu 24.04 olarak sabitlendi. Lint uyarıları giderildi. Yerel veritabanının migration öncesi yedeği `prisma/dev.db.before-migrations` dosyasında tutuluyor; Git'e gönderilmiyor.

Önceki altyapı doğrulaması: 12 test dosyasında 71 test geçti. Boş ve mevcut veritabanı migration testleri başarılı. Lint hatasız ve uyarısız. Üretim bağımlılık audit'i 0 uyarı bildiriyor. Üretim derlemesi başarılı; çalışan uygulamada CV kaydetme–yeniden açma–güncelleme–paylaşımı açma/kapatma, dil koruma ve başka kullanıcının CV'sini değiştirememe kontrolleri geçti.

Kalan kurulum ve sınırlar:

- `.env` içine AI anahtarı, iş arama için `APIFY_API_TOKEN`, e-posta için SMTP bilgileri ve üretimde HTTPS `APP_URL` girilmeli. Gerçek AI, Apify ve SMTP işlemleri anahtarlar bulunmadığı için canlı servislerle denenmedi; sağlayıcı yanıtları testlerde taklit edildi.
- Tam `npm audit` geliştirme araçlarında 9 etkilenen bağımlılık bildiriyor: 7 yüksek, 2 orta. Bunlar Tailwind/ESLint araçlarının glob/selector bağımlılıklarında; üretim audit'i temiz. `braces` için mevcut audit kaydı bütün sürümleri kapsıyor.
- İstek sınırları süreç belleğinde tutuluyor. Birden fazla sunucuda ortak sayaç deposu gerekir.
- Eski veritabanı önceki Git commitlerinde bulunuyor; bu çalışma Git geçmişini yeniden yazmadı. Eski mülakat kayıtlarında sahip bilgisi yoksa bunlara kullanıcı erişimi kapalıdır; geçmiş CV kayıtlarında önceden silinmiş alanlar geri üretilemez.

OpenAI'nin eski GPT-4 Turbo modeli için JSON modu uyumu [resmî belgeler](https://developers.openai.com/api/docs/guides/structured-outputs#supported-models) üzerinden kontrol edildi. AI sağlayıcı ve SMTP testleri dış servislere gerçek istek/e-posta göndermiyor.
