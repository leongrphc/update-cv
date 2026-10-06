# Update CV — Güncel durum

6 Ekim 2026. Proje mevcut klasöre klonlandı; geliştirmeler sırayla commit edilerek `main` dalına gönderildi.

Profesyonel CV düzenleme için yeni akış: **PDF yükle → çıkarılan bilgileri ve kaynak metni kontrol et → alanlara aktar → düzenle → şablon seç → gerçek PDF önizlemesi → indir/kaydet**. İçe aktarma geri alınabilir; eski CV kaydı korunur. Eksik bilgiler boş kalır, belirsizlikler ve aktarılamayan bölümler gösterilir. Bilgi çıkarımı AI gerektirir ve kullanıcı kontrolünden geçmelidir. PDF okuyucu, uygulamanın kendi çıktısını tekrar okuyabilecek sürüme güncellendi. Üç Open Sans fontu lisansıyla projeye alındı; altı şablon dış font sunucusu gerektirmez. Önizleme ve indirilen PDF aynı dosyayı kullanır.

Bu turda `8592d40` ile PDF içe aktarma API'si, `0a57fb8` ile kontrol/geri alma ekranı, PDF okuyucu güncellemesi ve tarayıcı testleri ayrı ayrı gönderildi. Son geliştirme gerçek PDF önizlemesi ve fontları içerir.

Bu akış masaüstü ve mobil tarayıcıda geçti: hatada mevcut alanların korunması, onay öncesinde formun değişmemesi, geri alma, yeni kayıt oluşturma, tekrar kayıtta kopya oluşmaması, PDF hatasından sonra tekrar deneme, Türkçe metnin PDF'de aranabilir kalması, önizleme/indirme eşitliği ve çıktının yeniden okunması. Altı şablonda çok sayfalı CV metninin korunması ayrıca doğrulandı. Güncel toplam: 15 dosyada 92 test; lint, üretim derlemesi ve çalışan uygulama kontrolleri geçti. Üretim audit'i 0 uyarı. Canlı AI çıkarımı anahtar olmadığı için doğrulanmadı; testlerde model cevabı sabit örnek verilerle sağlandı.

Profesyonel editör için sonraki eksikler: otomatik taslak kaydı ve yenilemede geri yükleme; tema ayarlarının kalıcı kaydı; proje/yayın gibi özel bölümleri düzenleme; AI önerilerini uygulamadan önce karşılaştırma ve hedef ilana göre yönlendirme; gerçek kullanıcı PDF'leriyle çıkarım/sayfa düzeni kontrolü. Taranmış PDF'lerde OCR ve orijinal tasarımı birebir düzenleme bu sürümde yok.

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
