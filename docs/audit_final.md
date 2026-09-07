# Learnaxia — Final Pre-Launch Audit (4. Tur)
> 17 Haziran 2026 — Platform açılışı öncesi son tarama

---

## Genel Değerlendirme

3 turda 43 madde kapatıldı. Mimari güvenlik çok iyi durumda:
- ✅ Tüm API route'ları `auth()` / `getMobileUser()` kontrolü yapıyor
- ✅ Admin route'ları ADMIN rolü kontrolü + production guard içeriyor  
- ✅ Rate limiting hem web hem mobil AI/auth endpoint'lerinde mevcut
- ✅ `debug-auth` endpoint'i → 410 Gone
- ✅ Soft-delete, token rotation, PEPPER, sanitization — tümü yerinde
- ✅ TypeScript: 0 hata

Bu turda bulunanlar: **2 Kritik · 4 Yüksek · 5 Orta · 6 Düşük**

---

## 🔴 KRİTİK

### K1 · `mobile/ai/generate-note` — Rate Limit YOK
**Sorun:** `POST /api/mobile/ai/generate-note` route'unda hiçbir rate limiting yok. Authenticate olan bir kullanıcı sınırsız AI not üretimi isteği gönderebilir → sınırsız Groq API maliyeti.  
Web versiyonunda var (`ai/generate-note`), mobilde eksik.  
**Fix:** `checkRateLimit({ key: 'mobile-generate-note:${userId}', limit: 10, windowMs: 3600000 })` ekle.

---

### K2 · `next.config.ts` — `remotePatterns` İçinde `hostname: '**'` Wildcard
**Sorun:** `{ protocol: 'https', hostname: '**' }` tüm HTTPS hostnamelerine izin veriyor. Bu Next.js Image Optimization'ı açık proxy olarak kullanılabilmesine neden olur. SSRF (Server-Side Request Forgery) vektörüdür.  
**Fix:** Bu satırı kaldır ve gerçekten kullanılan hostnameleri ekle.  
Şu an zaten: `api.dicebear.com`, `lh3.googleusercontent.com`, `avatars.githubusercontent.com` + user-provided image URL'leri varsa `cloudinary.com` veya benzeri.

---

## 🟠 YÜKSEK

### H1 · `privacy/page.tsx` + `terms/page.tsx` — İletişim E-postası Gmail
**Sorun:** Gizlilik Politikası ve Kullanım Şartları'ndaki tüm iletişim adresleri `learnaxia@gmail.com`. App Store ve Google Play **kurumsal e-posta** adresi ister. Gmail, KVKK/GDPR iletişim noktası olarak çok zayıf.  
**Etkilenen:** 9 farklı yerde — privacy, terms, contact sayfaları.  
**Fix:** `hello@learnaxia.com` veya `privacy@learnaxia.com` gibi domain e-postasına geç.

---

### H2 · `privacy/page.tsx` + `terms/page.tsx` — Son Güncelleme Tarihi 2025
**Sorun:** `const lastUpdated = "10 Haziran 2025"` — platform 2026'da açılıyor ama yasal belgeler 2025'i gösteriyor. App Store review'da sorun çıkartabilir.  
**Fix:** `"17 Haziran 2026"` olarak güncelle.

---

### H3 · `MobileRegisterSchema` — Şifre Min 6 Karakter (Çok Zayıf)
**Sorun:** `password: z.string().min(6)` — 6 karakter minimum günümüz standartlarının altında. NIST SP 800-63B minimum 8 karakter öneriyor. Apple App Store da güçlü şifre politikası bekliyor.  
**Fix:** Min 8'e yükselt, hem `packages/shared/src/validation/auth.schema.ts`'de hem `apps/web/app/api/auth/register/route.ts`'de.

---

### H4 · `server-health` Endpoint — Node.js Versiyonunu Açığa Çıkartıyor
**Sorun:** `process.version` response'ta dönüyor → `{ "node": "v20.15.1" }`. Bu bilgi saldırganlar için CVE aramasında kullanılabilir.  
**Fix:** `node` alanını kaldır veya sadece major versiyon göster.

---

## 🟡 ORTA

### M1 · `auth/register/route.ts` — Şifre Gücü Kontrolü Yok (Web)
**Sorun:** Web kayıt route'unda sadece `min(6)` var. Büyük/küçük harf, rakam, özel karakter zorunluluğu yok. Min 8'e çıkartmak yeterli ama büyük/küçük harf kombinasyonu da eklenebilir.  
**Fix:** Regex ekle: `/(?=.*[A-Z])(?=.*[0-9])/` veya sadece min 8.

---

### M2 · `cron/recalculate-scores` — 2x `console.log` Production'da
**Sorun:** `console.log('[Cron] Recalculating scores for ${userIds.length} users...')` ve `console.log('[Cron] Done.')` — Cron her gece çalışır ve bu loglar Railway'de görünür. `console.log` yerine `console.info` veya tamamen kaldırılmalı.  
**Fix:** Kaldır veya `console.info`'ya çevir.

---

### M3 · `wipe-db` Admin Route — `console.log` Production Build'a Giriyor  
**Sorun:** `console.log("Starting full database wipe...")` ve `console.log("Database wipe completed...")` — NODE_ENV check ile production'da route tamamen kapatılıyor (403) ama satırlar TypeScript derleniyor ve potansiyel güvenlik izlerini log dosyalarına bırakıyor.  
**Fix:** `console.log`'ları kaldır.

---

### M4 · `mobile/ai/generate-note` — `language` Validasyonu Zayıf
**Sorun:** `language: z.string().default("tr")` — herhangi bir string geçebilir. `"zh-CN"`, `"ru"` gibi desteklenmeyen dil kodları AI prompt'a gidiyor, tahmin edilemez sonuçlar.  
**Fix:** `z.enum(["tr", "en"]).default("tr")`.

---

### M5 · `logs/route.ts` — In-Memory Cache Uçucu
**Sorun:** `ipCache` ve `duplicateCache` Map'leri in-memory tutuluyor. Serverless deployment'ta (Railway + Next.js) her cold start'ta sıfırlanır → rate limiting tamamen işlevsiz hale gelir. Client-side log bombardımanına karşı koruma yok.  
**Fix:** `checkRateLimit` util'ini (Redis/DB tabanlı) bu route için de kullan.

---

## 🔵 DÜŞÜK

### L1 · `shared/auth.schema.ts` — `MobileLoginSchema` Şifre Kontrolü Yok
**Sorun:** Login'de `password: z.string().min(1)` — en az 1 karakter. Bu, login'de gereksiz kısa string'lerin DB'ye kadar ulaşmasına izin verir. Server'da anyway bcrypt compare yapılıyor ama defensively min 6 eklenmeli.

---

### L2 · `contact/page.tsx` — İletişim Formu Yok, Sadece E-posta Linki
**Sorun:** Contact sayfası sadece e-posta adresi gösteriyor. App Store formları genellikle çalışan bir iletişim mekanizması bekler. Düşük öncelikli ama App Store reddine neden olabilir.  
**Not:** Gmail adresi bu sayfada da kullanılıyor (H1 ile bağlantılı).

---

### L3 · `app.json` — `newArchEnabled: false`
**Sorun:** React Native New Architecture (Fabric + JSI) devre dışı. Expo SDK 52+ ile varsayılan aktif. Bazı yeni kütüphaneler yalnızca New Architecture destekliyor. Kısa vadede sorun değil ama teknik borç.

---

### L4 · `app.json` — `experiments.typedRoutes: false`
**Sorun:** Typed routes devre dışı → route string'leri type-safe değil. Geliştirmede hata riskini artırır. Production'a etkisi yok ama DX kalitesini düşürür.

---

### L5 · `AuthContext.tsx` — `login`/`register` Console.Error Logluyor
**Sorun:** `console.error('Login error', error)` ve `console.error('Register error', error)` — bu satırlar production build'da Hermes runtime'da çalışır. Hata detayları cihaz loglarında görünür olabilir.  
**Fix:** Kaldır veya __DEV__ guard ekle.

---

### L6 · `prisma/schema.prisma` — `LearningJourney` Model Index Eksik
**Sorun:** `LearningJourney` modelinde `userId` için index yok. Library sorguları ve userId'ye göre filtreleme büyük kullanıcı tabanında yavaşlayacak.  
**Fix:** `@@index([userId])` ekle.

---

## 📋 ÖZET TABLO

| # | Sev. | Konu | Aksiyon |
|---|------|------|---------|
| K1 | 🔴 | `mobile/generate-note` rate limit yok | Kod |
| K2 | 🔴 | `next.config.ts` wildcard hostname | Kod |
| H1 | 🟠 | Gmail iletişim adresi 9 yerde | Manuel (domain e-posta) |
| H2 | 🟠 | Yasal sayfalarda yıl 2025 | Kod (1 satır) |
| H3 | 🟠 | Şifre min 6 → min 8 gerekiyor | Kod |
| H4 | 🟠 | `server-health` Node.js versiyon açığı | Kod |
| M1 | 🟡 | Web register şifre zayıf validasyon | Kod |
| M2 | 🟡 | Cron route 2x console.log | Kod |
| M3 | 🟡 | wipe-db console.log | Kod |
| M4 | 🟡 | generate-note language enum değil | Kod |
| M5 | 🟡 | logs route in-memory rate limit | Kod/tasarım |
| L1 | 🔵 | Login schema min 1 şifre | Kod |
| L2 | 🔵 | Contact sayfası iletişim formu yok | İsteğe bağlı |
| L3 | 🔵 | newArchEnabled: false | Teknik borç |
| L4 | 🔵 | typedRoutes: false | Teknik borç |
| L5 | 🔵 | AuthContext login/register console.error | Kod |
| L6 | 🔵 | LearningJourney userId index eksik | Prisma migration |

---

## Geçmiş Turlar

| Tur | Bulunan | Durum |
|-----|---------|-------|
| Tur 1 | 25 madde | ✅ Tümü kapatıldı |
| Tur 2 | 9 madde | ✅ Tümü kapatıldı |
| Tur 3 | 9 madde | ✅ Tümü kapatıldı |
| Tur 4 (Bu) | 17 madde | ⏳ Bekleniyor |

