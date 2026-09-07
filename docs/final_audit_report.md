# Learnaxia — Tam Hazırlık Tarama Raporu
> 15 Haziran 2026 · Web + Mobil

---

## 🔴 KRİTİK — Deploy'dan önce mutlaka düzeltilmeli

### S1 · Açık Debug Endpoint — `GET /api/debug-auth`
**Sorun:** Session içeriğini ve cookie değerlerini herkese açık olarak döndürüyor. Auth bypass / session hijack vektörü.  
**Dosya:** `app/api/debug-auth/route.ts`  
**Fix:** Dosyayı tamamen sil veya `NODE_ENV === 'production'` guard ekle.

---

### S2 · Korunmasız Seed Endpoint — `GET /api/admin/seed-test`
**Sorun:** Hiçbir auth kontrolü yok. Herkes bu endpoint'i çağırarak DB'ye sahte admin kullanıcısı (`role: 'ADMIN'`) oluşturabilir.  
**Dosya:** `app/api/admin/seed-test/route.ts`  
**Fix:** Production guard + ADMIN rol kontrolü ekle.

---

### S3 · Hardcoded Secret — `sync-visibility` endpoint
**Sorun:** `if (secret !== "learnaxia-sync-2024")` — secret kaynak kodda plaintext yazıyor.  
**Dosya:** `app/api/admin/sync-visibility/route.ts`  
**Fix:** `process.env.SYNC_SECRET` ile karşılaştır, `.env.example`'a ekle.

---

### S4 · Hardcoded Admin E-postası — 4 farklı dosyada
**Sorun:** `netemre387@gmail.com` e-posta adresi kaynak kodda hardcoded yazıyor. Kod herkesin görebileceği bir git repo'ya push edilirse bu e-posta ifşa edilmiş olur.  
**Dosyalar:** `admin/logs/route.ts`, `admin/ai-logs/route.ts`, `admin/layout.tsx`, `admin/system/logs/page.tsx`  
**Fix:** Sadece `process.env.ADMIN_EMAIL` ile karşılaştır.

---

### S5 · Error Detail Leak — Mobile Login
**Sorun:** `detail: error?.message || String(error)` — dahili hata mesajları client'a gönderiliyor. Stack trace, DB hataları vs. sızabilir.  
**Dosya:** `app/api/mobile/login/route.ts:103`  
**Fix:** `detail` alanını kaldır, sadece generic `"Internal server error"` dön.

---

### S6 · AI Endpoint'lerinde Rate Limit Eksik
**Sorun:** `/api/ai/learning-path/generate`, `/api/ai/generate-note`, `/api/ai/learning-path/generate-slide`, `/api/ai/learning-path/modify` endpoint'lerinde rate limit yok. Bu endpoint'ler Groq API'yi çağırıyor — sınırsız istek gönderilerek Groq kota aşımı / maddi maliyet oluşturulabilir.  
**Fix:** Her AI endpoint'ine `checkRateLimit({ limit: 10, windowMs: 60 * 60 * 1000 })` ekle.

---

### S7 · Mobile Login `emailVerified` Kontrolü Eksik
**Sorun:** Web login'de email doğrulama zorunlu yapıldı (`auth.ts`) ama mobil login (`/api/mobile/login`) bunu kontrol etmiyor. Mobil üzerinden e-posta doğrulanmadan giriş yapılabiliyor.  
**Dosya:** `app/api/mobile/login/route.ts:63`  
**Fix:** `user.emailVerified` kontrolü ekle.

---

### S8 · Mobile Register — Email Doğrulama Göndermiyor
**Sorun:** Mobil kayıt endpoint'i (`/api/mobile/register`) kullanıcıyı oluşturuyor ama doğrulama e-postası göndermiyor. `emailVerified: null` olarak bırakıyor — sonra web kontrolü nedeniyle giriş yapılamıyor.  
**Dosya:** `app/api/mobile/register/route.ts`  
**Fix:** `sendVerificationEmail` çağrısı ekle veya mobil için `emailVerified`'i otomatik set et (strateji seçilmeli).

---

## 🟠 YÜKSEK — Hızla düzeltilmeli

### H1 · `app.json` — iOS `bundleIdentifier` ve `buildNumber` Eksik
**Sorun:** App Store'a build göndermek için `ios.bundleIdentifier` ve `ios.buildNumber` gerekli.  
**Dosya:** `apps/mobile/app.json`  
**Fix:**
```json
"ios": {
  "bundleIdentifier": "com.learnaxia.app",
  "buildNumber": "1",
  "supportsTablet": true
}
```

---

### H2 · `eas.json` Submit Config Boş
**Sorun:** `"submit": { "production": {} }` — Apple/Google store credential'ları tanımlanmamış. `eas submit` çalışmaz.  
**Fix:** Apple ASC API key veya Apple ID credentials, Android service account ekle.

---

### H3 · Web Forgot-Password — Rate Limit Yok
**Sorun:** `/api/auth/forgot-password` endpoint'inde rate limit yok. Saldırgan binlerce e-posta adresiyle spam istek atabilir → Resend kotası aşılır.  
**Dosya:** `app/api/auth/forgot-password/route.ts`  
**Fix:** `checkRateLimit({ key: 'forgot:${ip}', limit: 3, windowMs: 60000 })` ekle.

---

### H4 · Web Register — Rate Limit Yok
**Sorun:** `/api/auth/register` endpoint'inde rate limit yok. Bot hesap oluşturabilir.  
**Dosya:** `app/api/auth/register/route.ts`  
**Fix:** IP başına `limit: 3, windowMs: 3600000` ekle.

---

### H5 · `console.log` Production Leak — Modules API
**Sorun:** `console.log('[API/MODULES] Fetched library for user ${session.user.id}...')` — her istek için user ID loglanıyor.  
**Dosya:** `app/api/modules/route.ts:71`  
**Fix:** Satırı sil veya `console.debug` ile değiştir.

---

### H6 · Mobile Login — `console.log` E-posta + IP Leak
**Sorun:** `console.log('[Mobile Login] Attempt for: ${email} from ${ip}')` — her giriş denemesinde e-posta adresi ve IP plaintext loglanıyor.  
**Dosya:** `app/api/mobile/login/route.ts:61`  
**Fix:** Satırı kaldır.

---

### H7 · Reset-Password API — Token Format Tutarsızlığı
**Sorun:** Web forgot-password, token'ı `identifier: 'reset:${email}'` ile kaydediyor. Ama API kontrol ederken `identifier.startsWith("reset:")` ile kontrol ediyor. Mobil forgot-password ise token'ı `identifier: 'password_reset:${user.id}'` ile kaydediyor. Bu formatlar uyumsuz — mobil şifre sıfırlama web reset-password sayfasında çalışmaz.  
**Dosyalar:** `app/api/auth/reset-password/route.ts`, `app/api/mobile/forgot-password/route.ts`  
**Fix:** İkisinde de aynı identifier formatını kullan (`password_reset:${userId}`).

---

### H8 · `app.json` — Expo Updates Devre Dışı
**Sorun:** `"updates": { "enabled": false }` — production'da OTA update (over-the-air güncelleme) çalışmayacak. Her JS değişikliği için store'a yeni build göndermek gerekecek.  
**Fix:** EAS Update ile entegre et: `"enabled": true, "url": "https://u.expo.dev/..."`.

---

## 🟡 ORTA — Market öncesi tamamlanması önerilen

### M1 · CSP (Content Security Policy) Header Eksik
**Sorun:** `next.config.ts`'de `X-Frame-Options`, `X-XSS-Protection` var ama CSP header yok. XSS saldırılarına karşı en güçlü koruma CSP'dir.  
**Fix:** `next.config.ts` headers bölümüne CSP ekle.

---

### M2 · `not-found.tsx` Sayfası — Navbar/Footer Yok
**Sorun:** 404 sayfası Navbar ve Footer içermiyor. Kullanıcı buraya düşerse uygulamaya geri dönemez.  
**Dosya:** `app/not-found.tsx`  
**Fix:** Navbar + "Ana Sayfaya Dön" butonu ekle.

---

### M3 · Contact Sayfası — GitHub Linki Hardcoded
**Sorun:** `github.com/emre-net/learnaxia` — özel repo linki public sayfada görünüyor.  
**Dosya:** `app/contact/page.tsx:36`  
**Fix:** GitHub satırını kaldır veya public repo linki ile değiştir.

---

### M4 · AI Endpoint — Auth Kontrolü Eksik (Journey Generate)
**Sorun:** `/api/ai/learning-path/generate` endpoint'inde `session` var ama **auth zorunlu değil** — auth olmadan da çalışıyor.  
**Dosya:** `app/api/ai/learning-path/generate/route.ts:17`  
**Fix:** Auth kontrolü `if (!session?.user?.id) return 401` ekle.

---

### M5 · Web `auth/forgot-password` — Rate Limit + uuidv4 Kullanıyor
**Sorun:** UUID v4 tahmin edilemez ama kriptografik açıdan önerilmez. `crypto.randomBytes(32).toString('hex')` daha güvenli.  
**Dosya:** `app/api/auth/forgot-password/route.ts:25`

---

### M6 · Boş Durum Tasarımları Eksik
**Sorun:** Library ve Discover sayfaları yeni kullanıcı için boş. İlk açılışta sadece boş bir alan görünüyor.  
**Fix:** Empty state component'i ekle — illüstrasyon + CTA butonu.

---

### M7 · Dashboard `page.tsx` — `useSession` Bağımlılığı
**Sorun:** Dashboard tamamen client-side rendering kullanıyor (`"use client"` + `useSession`). SEO için sorun değil (dashboard zaten index edilmemeli) ama initial load CLS (Cumulative Layout Shift) yaşanıyor.

---

### M8 · Mobile `app.json` — `scheme: "mobile"` Genel
**Sorun:** Deep link scheme olarak `"mobile"` çok genel — başka uygulamalarla çakışabilir.  
**Fix:** `"scheme": "learnaxia"` yap.

---

## 🔵 DÜŞÜK — Kalite artışı

### L1 · `_next/image` Remote Pattern Eksik
**Sorun:** `next.config.ts`'de `images.remotePatterns` tanımlanmamış. Harici URL'lerden gelen profil resimleri çalışmayabilir.  
**Fix:** `images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }` ekle.

---

### L2 · Production Source Maps Açık Debug Bilgisi
**Sorun:** `productionBrowserSourceMaps: false` doğru ama bundle analizi için Sentry entegrasyonu önerilir.

---

### L3 · Mobile `useLanguage` Hook — `setLanguage` Export'u Belirsiz
**Sorun:** `useLanguage` hook'undan `setLanguage` export edilmiyor muydu kontrol edilmeli — profile.tsx'e eklendi ama hook tanımında yoksa runtime crash.

---

### L4 · `eslint: { ignoreDuringBuilds: true }` — Lint Hataları Gizleniyor
**Sorun:** `next.config.ts`'de ESLint build'de görmezden geliniyor. Production'da lint hataları olabilir.

---

### L5 · Footer — Sosyal Medya Linkleri Placeholder
Kontrol edilmeli: Footer'daki sosyal medya ikonları gerçek profile linklere götürüyor mu?

---

## 📋 ÖZET TABLO

| # | Seviye | Konu | Durum |
|---|--------|------|-------|
| S1 | 🔴 | `debug-auth` açık endpoint | Düzeltilmeli |
| S2 | 🔴 | `seed-test` auth yok | Düzeltilmeli |
| S3 | 🔴 | Hardcoded secret | Düzeltilmeli |
| S4 | 🔴 | Hardcoded admin e-posta (4 dosya) | Düzeltilmeli |
| S5 | 🔴 | Error detail leak | Düzeltilmeli |
| S6 | 🔴 | AI endpoint rate limit yok | Düzeltilmeli |
| S7 | 🔴 | Mobil login email verified yok | Düzeltilmeli |
| S8 | 🔴 | Mobil register e-posta doğrulaması yok | Karar verilmeli |
| H1 | 🟠 | `app.json` iOS config eksik | Düzeltilmeli |
| H2 | 🟠 | `eas.json` submit boş | Düzeltilmeli |
| H3 | 🟠 | Web forgot-password rate limit yok | Düzeltilmeli |
| H4 | 🟠 | Web register rate limit yok | Düzeltilmeli |
| H5 | 🟠 | console.log production leak (modules) | Düzeltilmeli |
| H6 | 🟠 | console.log e-posta + IP leak (login) | Düzeltilmeli |
| H7 | 🟠 | Reset password token format tutarsız | Düzeltilmeli |
| H8 | 🟠 | OTA update devre dışı | Düzeltilmeli |
| M1 | 🟡 | CSP header yok | Önerilen |
| M2 | 🟡 | 404 sayfası navigation yok | Önerilen |
| M3 | 🟡 | Contact'ta özel GitHub linki | Önerilen |
| M4 | 🟡 | Journey generate auth yok | Önerilen |
| M5 | 🟡 | uuidv4 yerine crypto kullan | Önerilen |
| M6 | 🟡 | Boş durum tasarımları | Önerilen |
| M8 | 🟡 | Deep link scheme genel | Önerilen |
| L1 | 🔵 | remotePatterns eksik | İsterse |
| L4 | 🔵 | ESLint ignore edilmiş | İsterse |

---

> **Kritik (S1–S8): 8 adet** — bunlar deploy'dan önce kesinlikle kapatılmalı.  
> **Yüksek (H1–H8): 8 adet** — store submission öncesi kapatılmalı.  
> **Orta + Düşük: 9 adet** — kalite ve UX için önerilen.
