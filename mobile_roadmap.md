ecTransact(Binder.java:1418)
PS C:\Users\Emre\.gemini\antigravity\scratch\learnaxity\learnaxia\apps\mobile> $p = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; if($p) { Stop-Process -Id $p.OwningProcess -Force; echo "8081 portu temizlendi." }
8081 portu temizlendi.
PS C:\Users\Emre\.gemini\antigravity\scratch\learnaxity\learnaxia\apps\mobile> ## Learnaxia – Web + Mobile Monorepo Roadmap

Bu doküman, mevcut Learnaxia Next.js uygulamasını bir **web + mobil ekosisteme** dönüştürmek için izlenecek teknik yol haritasını tanımlar. Hedefler:

- **Monorepo** (web + mobil + shared paketler)
- **Turborepo** ile verimli geliştirme
- **Expo / React Native** ile mobil uygulama (Android + iOS)
- **JWT tabanlı mobil auth**, mevcut NextAuth altyapısı ile uyumlu
- İlk sürümde **çekirdek öğrenme deneyimine** (Study, Modules, Learning Journey) odaklanan bir **MVP mobil app**

Roadmap faz faz ilerlemek için tasarlanmıştır. Her fazda yapılacak işler ve mümkün olduğunca net “tamamlanma kriterleri” bulunur. Bu dosya sadece **plan ve görev listesi** içerir; uygulama (kod yazımı) senin tarafında olacak.

---

## Faz 0 – Mevcut Durumu Dondurma ve Netleştirme

**Amaç:** Monorepo’ya ve mobile’a geçmeden önce, mevcut web/backend durumunu netleştirip belirsizlikleri azaltmak.

### 0.1 – Versiyonlar ve Ortam (env) Haritası

- `learnaxia/package.json` (veya yeni `apps/web/package.json`) içindeki sürümleri not et:
  - `"next": "16.1.6"`
  - `"react": "19.2.3"`, `"react-dom": "19.2.3"`
  - `@prisma/client` / `prisma`: `^5.10.2`
  - Diğer kritik bağımlılıklar: `next-auth`, `bullmq`, `ioredis`, `zod`, `openai` (Groq client olarak kullanılıyor), `date-fns`, `luxon` vb.
- Ortam değişkenlerini üç gruba ayır:
  - **Veritabanı & altyapı**: `DATABASE_URL`, Redis ile ilgili env’ler, `RESEND_API_KEY`, `NODE_ENV` vs.
  - **Auth**: `NEXTAUTH_SECRET`, OAuth client ID/secret’lar, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
  - **AI**: `GROQ_API_KEY` (ana), varsa `OPENAI_API_KEY` (yalnızca fallback için).
- Her environment (local, staging, production) için hangi env’lerin zorunlu olduğunu kısa bir tablo halinde not et.

### 0.2 – Auth Stratejisinin Yazılı Olarak Netleştirilmesi

- **Web (NextAuth) tarafı:**
  - `auth.ts` dosyasına bakarak şunları not et:
    - Session stratejisi: JWT tabanlı.
    - Kullanılan provider’lar: Google OAuth, Credentials (admin için env tabanlı login + normal kullanıcı login).
    - Kullanıcı modeli: `User.role`, `User.status`, `User.deletedAt`, `User.sessionVersion`, `User.language` gibi alanların auth kararlarında nasıl kullanıldığını not et.
    - `createUser` event’inin handle üretme mantığını özetle.

- **Mobil JWT tarafı:**
  - API rotaları:
    - `app/api/mobile/login/route.ts`
    - `app/api/mobile/register/route.ts`
    - `app/api/mobile/refresh/route.ts`
  - JWT yardımcıları:
    - `lib/auth/mobile-jwt.ts`: access ve refresh token üretme/doğrulama fonksiyonlarını, kullanıldığı claim’leri (userId, tokenVersion vs.) listele.
    - `lib/auth/mobile-refresh.ts`: refresh token rotation, revoke, expiry detaylarını özetle.
  - Rate limiting:
    - `lib/rate-limit.ts` ve `ApiRateLimit` Prisma modeliyle login/refresh isteklerindeki sınırlandırma mantığını maddeler halinde yaz.
  - `auth()` fonksiyonundaki Bearer fallback:
    - Önce NextAuth session, sonra `Authorization: Bearer <accessToken>` kontrolü; bu tasarımı kısa bir diyagram veya maddeli listeyle özetle.

### 0.3 – Domain Alanlarının Haritası

- Aşağıdaki ana domain’leri ve ilgili dosyaları basit bir liste halinde çıkar:
  - **Modules & Items** (öğrenme içeriği)
  - **Study & SM2** (çalışma akışı, timer, progress)
  - **Notes** (manuel ve AI notlar)
  - **Learning Journey** (AI tabanlı yolculuklar, slides, library)
  - **Library** (koleksiyonlar, modüller, journeys, user library modelleri)
  - **Analytics** (dashboard, kullanıcı aktivite metrikleri)
  - **Tokens & Subscription** (TokenWallet, TokenTransaction, Plan, Subscription, PaymentMethod)
  - **Admin + Logs** (kullanıcı yönetimi, sistem logları, AI logları)
  - **AI Layer** (Groq/OpenAI provider’ları, Zod şemaları, BullMQ işler)
- Her domain için:
  - İlgili Prisma modelleri.
  - İlgili `domains/*` servis dosyaları.
  - Önemli API rotaları (`app/api/...`).

**Faz 0 Tamamlanma Kriterleri:**

- [ ] Kullanılan framework ve kütüphane sürümleri net bir şekilde not edildi.
- [ ] Env değişken haritası (hangi ortamda ne gerekiyor) yazıldı.
- [ ] Web ve mobil auth stratejisi (NextAuth + JWT) yazılı olarak özetlendi.
- [ ] Ana domain alanlarının ve ilgili dosyaların listesi çıkarıldı.

---

## Faz 1 – Monorepo + Turborepo İskeleti

**Amaç:** Learnaxia’yı tek bir Next.js projesinden çıkarıp, **Turborepo ile yönetilen bir monorepo** yapısına dönüştürmek.

### 1.1 – Hedef Dizin Yapısı

Planlanan ana yapı:

- `package.json` (root – workspace + turbo script’leri)
- `turbo.json`
- `apps/`
  - `web/` → mevcut Next.js uygulaması (şimdiki `learnaxia`)
  - `mobile/` → Expo/React Native uygulaması (ileride)
- `packages/`
  - `shared/` → ortak tipler, Zod şemaları, i18n, util fonksiyonlar
  - (opsiyonel) `api-client/` → mobil/web için ortak HTTP client
  - (opsiyonel) `auth/` → auth ile ilgili paylaşılan TS kodları

Bu dizin yapısını, gerçek taşıma işlemine başlamadan önce dokümante et (örneğin bu dosyaya bir ağaç görünümü olarak ekle).

### 1.2 – Root `package.json` ve Workspaces Tasarımı

- Root `package.json` için düşünülmesi gerekenler:
  - `"private": true` olmalı.
  - `"workspaces"` alanı:
    - `"apps/*"`, `"packages/*"` gibi bir pattern.
  - Ortak script’ler:
    - `"dev": "turbo run dev"`
    - `"build": "turbo run build"`
    - `"lint": "turbo run lint"`
    - (isteğe bağlı) `"test": "turbo run test"`
  - Root devDependencies:
    - `turbo`, `typescript`, `eslint`, monorepo yönetimi için gerekebilecek diğer araçlar.

Bu aşamada yalnızca hangi script’lerin ve hangi workspaces pattern’lerinin kullanılacağını kâğıt üzerinde belirle.

### 1.3 – `turbo.json` Pipeline Taslağı

- En temel pipeline tanımı:
  - `"build"`:
    - `dependsOn: ["^build"]`
    - `outputs`: `[".next/**", "dist/**"]`
  - `"dev"`:
    - `cache: false`
  - `"lint"`:
    - `outputs: []`
- Sonraki aşamada:
  - Web ve mobile için özel `dev` komutlarını (örn. `web#dev`, `mobile#dev`) nasıl çalıştırmak istediğini planla.

### 1.4 – Mevcut Web Uygulamasını `apps/web` Altına Taşıma Planı

- Taşınacak ana klasörler:
  - `app/`, `components/`, `domains/`, `lib/`, `hooks/`, `stores/`, `public/`, `tests/`, `prisma/`, `scripts/` (varsa).
- Dikkat edilmesi gerekenler:
  - `@/` alias’larının kökünün değişmesi:
    - Şu an `learnaxia` kökünü gösteriyorsa, monorepo’da `apps/web` kökünü göstermesi gerekecek.
  - `prisma` komutları:
    - `prisma generate`, `prisma db push`, `prisma migrate` script’lerinin root’tan mı yoksa `apps/web` içinden mi çalışacağına karar ver.
  - `next.config.*` ve `tsconfig.json`:
    - Monorepo’ya uygun olacak şekilde imports/paths düzenleri tasarlanmalı.

Bu aşamada sadece “hangi dizin nereye gidecek, hangi konfig dosyası nasıl güncellenecek” bilgisini netleştir; gerçek taşıma bir sonraki adımda yapılabilir.

**Faz 1 Tamamlanma Kriterleri:**

- [ ] Monorepo dizin yapısı yazılı olarak netleştirildi.
- [ ] Root `package.json` için workspaces ve script’ler tasarlandı.
- [ ] `turbo.json` için temel pipeline yapısı kağıt üzerinde hazır.
- [ ] `apps/web` altına taşıma için klasör/dosya bazında bir checklist oluşturuldu.

---

## Faz 2 – Shared Paket(ler) ve Domain Kodunun Ayrıştırılması

**Amaç:** Hem web hem mobil tarafından kullanılabilecek **ortak kodu** `packages/shared` (ve gerekirse diğer paketler) altına taşımak için net bir plan oluşturmak.

### 2.1 – Paylaşıma Uygun Kodların Envanteri

- **Ortak tipler (TypeScript)**:
  - Prisma modelleri ile 1-1 ilişkili interface’ler:
    - `User`, `Module`, `Item`, `LearningJourney`, `LearningSlide`, `UserJourneyLibrary`, `TokenWallet`, `TokenTransaction`, `Plan`, `Subscription`, vb.
  - Bu tiplerin bugün nerede tanımlı olduğunu (veya nerede ihtiyaç duyulduğunu) listele.

- **Zod şemaları:**
  - `lib/ai/openai.ts` içindeki:
    - `FlashcardSchema`, `MCSchema`, `GapSchema`, `TFSchema`, `GenerationSchema`.
  - `domains/ai/openai.provider.ts` içindeki:
    - `GenerationSchema`, `EvaluationSchema`, `VisionSchema`, `SlideGenerationSchema`.
  - Diğer alanlardaki form/validation şemaları (örn. auth formları, profil formları vs.).

- **i18n altyapısı:**
  - `lib/i18n` ve `useTranslation` benzeri hook/utility’ler.
  - Kullanılan translation key yapısı (örnek: `dashboard.title`, `library.emptyState`, vb.).

- **Generic util fonksiyonlar:**
  - Tarih/format fonksiyonları (`date-fns`, `luxon` kullanan helper’lar).
  - Ortak sabitler:
    - Soru tipleri, roller (`ADMIN`, `USER`), statüler (`ACTIVE`, `SUSPENDED`), vb.

Envanter çıkarırken her madde için **dosya yolu** + **kullanım amacı** not et; bu, `packages/shared` içindeki klasör yapısını tasarlarken rehber olacak.

### 2.2 – `packages/shared` İç Yapı Tasarımı

- Önerilen alt klasörler:
  - `packages/shared/domain-types` → Tüm ortak TypeScript type / interface’ler.
  - `packages/shared/validation` → Zod şemaları (AI, form validasyonları, vb.).
  - `packages/shared/i18n` → Dil dosyaları + ortak i18n helper’ları.
  - `packages/shared/config` → Ortak ayarlar (örneğin soru tipi enum’ları, default language, vb.).
  - (İleride) `packages/shared/ui` → saf tasarım token’ları (renk adları, spacing değerleri).

- Bağımlılık politikası:
  - `shared` paketleri React, Next, React Native gibi UI framework’lerine **bağımlı olmamalı**.
  - `shared` içinde sadece saf TypeScript, Zod, ufak helper kütüphaneler (örn. `zod`, `date-fns`) kullanılmalı.

Bu aşamada sadece **klasör yapısını ve hangi tip/şemaların nereye gideceğini kâğıt üzerinde netleştir**; gerçek taşıma sonra.

### 2.3 – (Opsiyonel ama Önerilen) `packages/api-client`

- Amaç: Mobil ve web’in API çağrılarını tek bir typed client üzerinden yapabilmesi.
- Modül bazlı taslak:
  - `authClient`:
    - `/api/mobile/login`, `/api/mobile/register`, `/api/mobile/refresh`.
  - `learningClient`:
    - `/api/ai/learning-path/start`, `/generate`, `/generate-slide`, `/complete`.
  - `libraryClient`:
    - `/api/library/journeys`, `/api/library/journeys/[id]`, modül/koleksiyon uçları.
  - `analyticsClient`, `notesClient` vb. (ileriki fazlar için ayrılabilir).
- Ortak `HttpClient` soyutlaması:
  - Base URL.
  - `Authorization: Bearer <accessToken>` header’ı ekleme.
  - 401 durumunda refresh logic tetikleme (ileride mobile tarafındaki mekanizma ile entegre edilecek).

**Faz 2 Tamamlanma Kriterleri:**

- [ ] Paylaşıma uygun tüm tipler, şemalar, i18n ve util’ler için bir envanter listesi hazırlandı.
- [ ] `packages/shared` için alt klasör yapısı ve içerik planı netleştirildi.
- [ ] (Varsa) `packages/api-client` için endpoint ve fonksiyon imzalarının kaba taslağı çıkarıldı.

---

## Faz 3 – Mobil Uygulama Altyapısı (Expo + Auth + API Client)

**Amaç:** `apps/mobile` altında Expo/React Native tabanlı bir mobil uygulama iskeleti kurmak için gerekli mimariyi ve ekranları planlamak.

### 3.1 – Navigasyon ve Ekran Mimarisi

- Navigation kararı:
  - `AuthStack`:
    - `LoginScreen`
    - `RegisterScreen`
  - `MainTabs`:
    - `HomeScreen`
    - `LearnScreen`
    - `LibraryScreen`
    - `ProfileScreen`
  - Gerekirse ekstra stack:
    - `JourneyPlayerScreen`
    - `ModuleStudyScreen`

- Her ekran için:
  - Kullanacağı API çağrılarını (hangi endpoint’ler).
  - Kullanacağı shared tip/şemaları.
  - Tek cümlelik “bu ekran ne yapar?” açıklaması.

### 3.2 – Mobil Auth Akışı (JWT)

- Auth flow taslağı:
  - Login:
    - Kullanıcı email+şifre girer → `/api/mobile/login`.
    - Dönen access/refresh token’ların nerede saklanacağı (SecureStore vs. AsyncStorage).
  - Her API isteği:
    - Request interceptor: Access token’ı `Authorization: Bearer` header’ına ekler.
  - Token süresi dolduğunda:
    - 401 dönerse → `/api/mobile/refresh` çağrısı.
    - Refresh başarılı → yeni access token ile isteği tekrar dene.
    - Refresh başarısız → kullanıcıyı logout et, login ekranına yönlendir.
  - Logout:
    - Lokal access + refresh token’ları temizle.
    - (İleride) server’a refresh token revoke diye bildirme düşünülür.

- Auth state yönetimi:
  - Kullanılacak state management kütüphanesini seç (React Query, Zustand, context + reducer, vb.) ve hangi context’lerde saklayacağını tasarla.

### 3.3 – Ortak Auth Kurallarıyla Uyum

- Backend kurallarını mobil tasarıma yansıt:
  - `User.status !== "ACTIVE"` ise login sonrası bazı istekler reddedilebilir → kullanıcıya net mesaj.
  - `deletedAt` dolu ise token’lar geçersiz → “Hesabın devre dışı” gibi bir akış.
  - `sessionVersion` mismatch → tüm token’ların geçersizleşmesi → yeniden login isteği.
- Mobilde bu durumlar için gösterilecek hata ekranlarını/metinleri planla (i18n key’leriyle birlikte).

**Faz 3 Tamamlanma Kriterleri:**

- [ ] Mobil navigasyon yapısı (stack/tab) ve ekran listesi yazılı halde net.
- [ ] Auth akışı (login, refresh, logout) adım adım tanımlandı.
- [ ] Error/hata durumlarında kullanıcıya gösterilecek mesaj/akış taslakları hazır.

---

## Faz 4 – Çekirdek Öğrenme Deneyimi (MVP Mobil Özellikler)

**Amaç:** Mobil uygulamanın ilk sürümünde yer alacak temel öğrenme deneyimini tanımlamak ve ekran/akış bazında planlamak.

### 4.1 – Kapsam Tanımı (MVP’de Olacaklar / Olmayacaklar)

- MVP’de **olacaklar**:
  - Login / Register.
  - Kullanıcının mevcut modül ve journey’lerini görebileceği basit bir Library.
  - Module/Item bazlı çalışma (flashcard, çoktan seçmeli, boşluk doldurma, doğru/yanlış).
  - Learning Journey oluşturma ve oynatma.
  - Basit bir “günün özeti” / çalışmaya devam et önerileri (çok detaylı grafikler olmadan).

- MVP’de **olmayacaklar** (ileriki fazlar):
  - Admin paneli, kullanıcı yönetimi, sistem log ekranları.
  - Gelişmiş analytics dashboard (karmaşık grafikler, filtreler).
  - Ödeme/abonelik yönetimi ekranları.
  - Reklam entegrasyonu.

Bu ayrımı net bir tablo halinde bu dosyada tut; böylece scope creep’i engellersin.

### 4.2 – Learning Journey UX Tasarımı

- Journey listesi ekranı:
  - Her journey için: başlık, toplam slide sayısı, tamamlanma yüzdesi.
  - “Devam et” butonu (kaldığı slide’dan başlatma).

- Journey oluşturma ekranı:
  - Inputlar: topic, depth, (opsiyonel) language.
  - Aksiyon: “AI ile yolculuk oluştur”.
  - Backend:
    - `/api/ai/learning-path/start` → job başlatma.
    - Job durumunu sorgulamak için hangi endpoint’leri nasıl kullanacağını planla (polling veya status endpoint).

- Journey oynatıcı:
  - Slide gösterimi:
    - Başlık + içerik.
    - Varsa peeking question (soru + seçenekler + doğru cevap).
  - Navigasyon:
    - Next/Prev butonları.
    - Progress bar veya step indicator.
  - Kullanıcının cevaplarına göre backend’de hangi progress endpoint’lerinin tetikleneceğini planla.

### 4.3 – Study / Timer Entegrasyonu

- Kaynak:
  - Web tarafındaki `study-store`, `use-timer`, `domains/study.service.ts`.
- Mobil plan:
  - Temel akış:
    - Soru göster → kullanıcı cevaplasın → doğru/yanlış feedback göster → bir sonraki soruya geç.
  - Timer:
    - Basit seans süresi sayacı (örneğin sadece “bu oturumda 12 dakika çalıştın”).
  - Gelişmiş SM2 / tekrar algoritmasını arka planda bırakıp, mobilde sade bir yüz ile temsil etmeyi düşün.

**Faz 4 Tamamlanma Kriterleri:**

- [ ] MVP’de olacak/olmayacak özelliklerin listesi onaylandı.
- [ ] Learning Journey için liste/oluşturma/oynatma akışları ekran bazında tasarlandı.
- [ ] Study/timer akışı ve backend entegrasyon noktaları netleştirildi.

---

## Faz 5 – Library & Basit Analytics

**Amaç:** Mobil kullanıcıya içeriklerini yönetmesi ve genel gidişatını görmesi için yeterli ama basit bir Library ve Analytics deneyimi sağlamak.

### 5.1 – Library (Kitaplık) Ekranları

- Library ana ekranı:
  - Sekmeler veya filtreler:
    - Modüller
    - Yolculuklar (Journeys)
    - (İsteğe bağlı) Koleksiyonlar
  - Her öğe için gösterilecek bilgileri planla:
    - Başlık, kısa açıklama, progress yüzdesi, son çalışma tarihi gibi.

- Öğeden detay ekrana geçiş:
  - Module → ModuleStudy ekranı.
  - Journey → JourneyPlayer veya JourneyDetail ekranı.

### 5.2 – Basit Analytics

- Hangi metrikler gösterilecek:
  - Son 7 gün çalışma süresi toplamı.
  - Toplam çözülen soru sayısı.
- Web’deki `app/dashboard/analytics` mantığını referans alarak:
  - Hangi endpoint’lerden bu metrikleri alacağını (veya almayı planladığını) not et.
  - Mobilde gösterimi:
    - İlk sürümde simple cards (sadece rakam + kısa açıklama).
    - Grafikler isteğe bağlı, daha sonraki bir ara faza bırakılabilir.

**Faz 5 Tamamlanma Kriterleri:**

- [ ] Library ekranlarının bilgi mimarisi ve navigation’ı yazılı olarak net.
- [ ] Gösterilecek analytics metrikleri ve API kaynakları listelendi.

---

## Faz 6 – Gelecek Fazlar (Ödeme, Reklam, Gelişmiş AI)

**Amaç:** MVP sonrası için şimdiden büyük resmi görmek ve ileride eklenecek modülleri kabaca konumlandırmak.

### 6.1 – Ödeme / Abonelik (Mobile)

- Web tarafındaki mevcut yapı:
  - `Plan`, `Subscription`, `TokenWallet`, `TokenTransaction`, `PaymentMethod` modelleri.
  - Stripe veya benzeri ödeme sağlayıcı entegrasyonu (varsa).
- Mobil için olası stratejiler:
  - Native in-app purchase (Google Play / App Store) + backend senkronizasyonu.
  - Web checkout (tarayıcı üzerinden Stripe) + mobilde sadece sonucu gösterme.
- Hangi stratejiyi tercih edeceğini (veya değerlendirme kriterlerini) bu dosyada not et.

### 6.2 – Reklam Altyapısı

- Hedef:
  - Ücretsiz kullanıcılar için belirli ekranlarda (örneğin Home veya Library’de) minimal, rahatsız etmeyen reklamlar.
- Karar verilmesi gerekenler:
  - Reklam ağı (AdMob vb.).
  - Frekans limitleri (örneğin X sorudan sonra en fazla 1 reklam).
  - Premium/abonelik sahibi kullanıcılar için reklam gösterilip gösterilmeyeceği.

### 6.3 – Gelişmiş AI Özellikleri

- Vision:
  - Kullanıcının kamera ile soru fotoğrafı çekmesi, backend’de `analyzeImage` benzeri bir fonksiyonla çözüm ve soru metnine çevrilmesi.
  - Mobil çekim ve upload akışının kaba planı.
- Zayıflık analizi ve öneriler:
  - `WeaknessReport`, `UserRetention` gibi tabloları kullanarak:
    - “Bugün şu konuları tekrar et” tarzında kişiselleştirilmiş öneri kartları.
  - Bu önerilerin hangi ekranda ve nasıl gösterileceğini (örneğin HomeScreen’de “Önerilen Çalışmalar” bölümü) tasarla.

**Faz 6 Tamamlanma Kriterleri:**

- [ ] Ödeme, reklam ve gelişmiş AI için yol haritası (hangi feature hangi sırada gelir) kabaca çizildi.
- [ ] MVP sonrasında odaklanılacak 1–2 özellik önceliklendirilerek not edildi.

---

Bu roadmap, Learnaxia’yı kademeli olarak **Next.js web + Expo mobil + shared monorepo** mimarisine taşıman için referans niteliğindedir.  
Her fazdan önce bu dosyaya dönüp:

- Kapsamı gözden geçirebilir,
- Gerekirse alt maddeler ekleyebilir veya bazı adımları sadeleştirebilir,
- İş bittiğinde ilgili fazın “Tamamlanma Kriterleri”ni kontrol listesi olarak kullanabilirsin.

