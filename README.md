# Learnaxia - Platform Mimari ve Vizyon Dokümanı

Bu doküman, projeye yeni dahil olan bir geliştirici veya yapay zeka asistanının **Learnaxia** platformunu anında kavrayabilmesi, amacını anlaması ve teknik altyapısına hakim olması için hazırlanmıştır. 

Lütfen kod yazmadan veya değişiklik yapmadan önce bu dokümanı dikkatlice okuyunuz.

---

## 1. Platformun Amacı ve Vizyonu
**Learnaxia**, yapay zeka destekli, modern ve oyunlaştırılmış bir dijital öğrenme ve çalışma (study) platformudur. Temel amacı, kullanıcıların kendi öğrenme materyallerini (PDF, resim, metin) sisteme yükleyerek bunlardan akıllı çalışma setleri, flashcard'lar ve öğrenme yolculukları (journeys) oluşturmasını sağlamaktır.

**Ana Özellikler:**
* **Akıllı Kamera (Vision):** Kullanıcı kamerayla bir sorunun veya metnin fotoğrafını çeker, sistem (AI Vision) bunu analiz edip çözüm sunar.
* **Belge İşleme (Document Parsing):** PDF veya belgeler yüklenerek bunlardan özetler ve çalışma kartları (flashcards) çıkartılır.
* **Oyunlaştırma (Gamification) ve İstatistikler:** Kullanıcının çalışma süreleri, modül bitirme oranları ve doğruluk yüzdeleri (DashboardStats) takip edilip gösterilir. "Günlük Tekrar" (Daily Review) widget'ları ile öğrenme teşvik edilir.
* **Öğrenme Yolculukları (Journeys):** Kullanıcılar için uzun soluklu eğitim programları ve çalışma yolları oluşturulur.

---

## 2. Mimari Yapı (Monorepo)
Proje, web ve mobil tarafları aynı çatı altında toplayan bir **Monorepo** mimarisi kullanmaktadır (NPM Workspaces / Turborepo tabanlı). Ortak kodlar tek bir pakette toplanarak her iki platformda da kullanılır.

```text
c:\lrx\
 ├── apps/
 │    ├── mobile/     # React Native (Expo) mobil uygulaması
 │    └── web/        # Next.js web uygulaması
 ├── packages/
 │    └── shared/     # Ortak paket (Zod şemaları, i18n çevirileri, Tema vb.)
 ├── docs/            # Analiz raporları, sorun giderme geçmişi (Troubleshooting) ve planlamalar
 └── package.json     # Ana monorepo yönetimi
```

---

## 3. Teknoloji Yığını (Tech Stack)

### A. Mobil Uygulama (`apps/mobile`)
* **Framework:** React Native & Expo (v52)
* **Yönlendirme (Routing):** Expo Router (Dosya tabanlı yönlendirme - `app/` klasörü)
* **Stil & UI:** NativeWind v2 (Tailwind CSS v3 kullanır). *Önemli Not: Üst dizindeki Tailwind v4 ile asenkron PostCSS çakışmasını önlemek için metro.config.cjs içinde özel bir çözümleme (resolver) yapılmıştır.*
* **Kamera:** `expo-camera`
* **Durum Yönetimi (State):** React Context API (`AuthContext` vb.)
* **Ağ Bağlantısı:** Axios (`lib/api.ts`)
* **Yerel Depolama:** `@react-native-async-storage/async-storage`

### B. Web Uygulaması (`apps/web`)
* **Framework:** React 19 & Next.js 15
* **Stil:** Tailwind CSS v4
* **Render Mimarisi:** App Router, React Server Components (RSC)

### C. Ortak Kütüphane (`packages/shared`)
Mobil ve web projeleri arasındaki veri bütünlüğünü sağlar:
* **Zod:** API İstekleri ve formlar için ortak veri doğrulama şemaları (`MobileLoginSchema` vb.).
* **i18n (Çeviri) - Custom Dictionary Sistemi:** Platformda üçüncü parti ağır kütüphaneler (react-i18next vb.) YERİNE kendi hafif `packages/shared/src/i18n` sözlük sistemimiz kullanılır. UI üzerinde asla hardcoded (sabit) metin kullanmayın. Her zaman `t('page.key', currentLang)` formatını kullanın. Dil çevirileri `dictionaries.ts` içinden okunur.
* **Temalandırma:** `theme.ts` içerisinde Siyah/Beyaz minimalizm (Apple/Vercel tarzı) ve Mavi/Kırmızı teknolojik vurgular yer alır. Tüm Web ve Mobil projeleri Tailwind üzerinden burayı okur.

---

## 4. Yapay Zeka (AI) İçin Kritik Geliştirme Notları

Eğer bu dokümanı okuyan bir **Yapay Zeka (AI Agent)** iseniz, projede geliştirme yaparken aşağıdaki mevcut kısıtlamalara ve kurallara DİKKAT EDİNİZ:

1. **NativeWind v2 vs Tailwind v4:** Web tarafı Tailwind v4 kullanırken, mobil taraf NativeWind v2 nedeniyle yerel (local) Tailwind v3 kullanmak zorundadır. `babel.config.js` ve `metro.config.cjs` bu durumu dengeleyecek şekilde ayarlanmıştır. **Asla mobil tarafta NativeWind'i v4 mimarisine veya Tailwind'i v4'e zorlamayın**, Metro çöker.
2. **Kamera Bileşeni:** `camera-screen.tsx` içerisinde Expo Camera referansı `React.RefObject<CameraView | null>` olarak tanımlanmıştır. Tip güvenliğine dikkat edin.
3. **i18n Çeviri Kullanımı:** Arayüz (UI) tasarlarken ASLA doğrudan "Giriş Yap" veya "Log in" gibi hardcoded metinler yazmayın. Mutlaka `useLanguage()` kancasını çağırıp `t('anahtar', currentLang)` sistemini kullanın.
4. **React Hooks Kuralları:** Tüm ekranlarda, özellikle veri yüklenirken (`if (loading) return...`), React Hook'larının erken dönüşlerden (early returns) **önce** yazıldığından emin olun. Geçmişte `index.tsx` bu yüzden çökmüştür.
5. **Windows'ta C++ Derlemeleri (Gradle):** `gradle.properties` dosyasında `org.gradle.jvmargs=-Xmx4096m` olarak 4GB ayrılmıştır. Gerekmedikçe bu değeri düşürmeyin, aksi takdirde `expo-modules-core` derlenirken JVM çöker.
6. **Dosya İsimlendirmeleri ve Linkler:** Bir dosyaya referans verirken her zaman tam yolu (Absolute Path) belirtin ve `[dosya adı](file:///c:/path/to/file)` formatını kullanın.

Learnaxia, sadece bir UI uygulaması değil; arkasında AI çalışan yoğun veri tabanlı bir eğitim platformudur. Yazacağınız her bileşende *kullanıcı deneyimini (UX)*, oyunlaştırma hissini ve performans optizimasyonunu (özellikle animasyonlarda `react-native-reanimated` kullanarak) ön planda tutmalısınız.
