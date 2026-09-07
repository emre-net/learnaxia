# Market Readiness — Execution Tasks

## Hafta 1 — Güvenlik + Yasal

### Güvenlik (Kod ile halledilebilen)
- [x] **S4** Email doğrulamasını aktif et (auth.ts:97 yorum kaldırıldı)
- [x] **S5** wipe-db endpoint production guard eklendi (NODE_ENV check)
- [x] **ENV** .env.example oluşturuldu
- [x] **GIT** crash_*.txt + .env dosyalarını mobile .gitignore'a eklendi

### Yasal
- [x] **L1** Kapsamlı Gizlilik Politikası yazıldı (17 madde, KVKK/GDPR)
- [x] **L2** Kapsamlı Kullanım Şartları yazıldı (15 madde)
- [x] **L3** Cookie Consent Banner eklendi (layout.tsx)

## Hafta 2 — Eksik Özellikler

- [x] **F1a** Hesap silme API — `DELETE /api/user/account`
- [x] **F1b** Hesap silme API — `DELETE /api/mobile/user/account`
- [x] **F1c** Hesap silme UI — Settings sayfasına Danger Zone eklendi
- [x] **F2a** Mobil şifre sıfırlama API — `/api/mobile/forgot-password` oluşturuldu
- [x] **F2b** Mobil login.tsx — gerçek API'ye bağlandı
- [x] **F1d** Mobil profil'e hesap silme UI — Alert + API bağlantısı
- [x] **F4** Onboarding akışı — 4 adımlı modal (web), framer-motion animasyonlu
- [x] **Dil** Mobil dil değiştirme — ActionSheetIOS/Alert + `/api/mobile/user/account/language`
- [x] **Bildirim** Mobil bildirim ayarları — Notifications.requestPermissionsAsync + Linking.openSettings

## Hafta 3 — SEO

- [x] **A4a** sitemap.ts oluşturuldu
- [x] **A4b** robots.ts oluşturuldu
- [x] **A5** OG image — oluşturuldu + layout.tsx'e eklendi

## Hafta 4 — Kalite

- [/] **Q2** Boş durum tasarımları (Library, Discover) — yapılıyor
- [ ] **Q1** Push notification sistemi (tam implementasyon)

## 🔴 Audit — Kritik Düzeltmeler
- [x] **S1** debug-auth endpoint → 410 Gone döndürüyor
- [x] **S2** seed-test → production guard + ADMIN rol kontrolü
- [x] **S3** hardcoded secret → `process.env.SYNC_SECRET`
- [x] **S4** hardcoded admin e-posta → `ADMIN_EMAIL` env (4 dosya)
- [x] **S5** error detail leak → kaldırıldı (mobile login)
- [x] **S6** AI rate limit → journey generate + generate-note (saatte 10)
- [x] **S7** Mobile login emailVerified kontrolü eklendi
- [x] **S8** Mobile register → `emailVerified: new Date()` (auto-verify)

## 🟠 Audit — Yüksek Öncelik
- [x] **H1** app.json iOS `bundleIdentifier: "com.learnaxia.app"` + `buildNumber: "1"`
- [x] **H2** eas.json submit config → Apple + Android placeholder
- [x] **H3** Web forgot-password → `checkRateLimit` eklendi (IP, dakikada 3)
- [x] **H4** Web register → `checkRateLimit` eklendi (IP, saatte 3)
- [x] **H5** console.log kaldırıldı — modules API
- [x] **H6** console.log kaldırıldı — mobile login
- [x] **H7** Reset token formatı düzeltildi → `reset:${email}` (web ile uyumlu)
- [x] **H8** OTA update aktif → `updates.enabled: true`

## 🟡 Audit — Orta Öncelik
- [x] **M1** CSP + HSTS header eklendi (next.config.ts)
- [x] **M2** 404 sayfası zaten navigation içeriyor ✓
- [x] **M3** Contact GitHub linki → `github.com/learnaxia`
- [x] **M4** Journey generate → auth zorunlu hale getirildi
- [x] **M5** uuidv4 → `crypto.randomBytes(32)`
- [x] **M6** EmptyState premium component → Library + Discover
- [x] **M8** Deep link scheme `"mobile"` → `"learnaxia"`

## 🔵 Audit — Düşük Öncelik
- [x] **L1** remotePatterns eklendi (DiceBear, Google, GitHub avatarları)

## 🔑 Manuel Yapılacaklar (Kodla değil, elle)

### Env / Güvenlik
- [ ] **E1** `AUTH_SECRET` → terminalden: `openssl rand -base64 32` → `.env`'e yaz
- [ ] **E2** `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` → [console.cloud.google.com](https://console.cloud.google.com) → `.env`'e yaz
- [ ] **E3** `CRON_SECRET` → terminalden: `openssl rand -hex 32` → `.env`'e yaz
- [ ] **E4** `GROQ_API_KEY` → production key'e güncelle (şu anki hard-coded)
- [ ] **E5** Admin şifresi bcrypt hash'le — şu an env'de plain-text duruyor

### Veritabanı
- [ ] **DB1** Railway aktifleşince scoring migration çalıştır:
  ```
  $env:DATABASE_URL="postgresql://..."
  npx prisma migrate dev --name add_momentum_scoring --schema=apps/web/prisma/schema.prisma
  ```

### App Store / Play Store
- [ ] **A0** ⚠️ EAS iOS submit credentials doldur — [eas.json](file:///C:/lrx/apps/mobile/eas.json) şu an `$APPLE_ID_EMAIL`, `$ASC_APP_ID`, `$APPLE_TEAM_ID` env referansları kullanıyor. `eas secret:create` ile ya da EAS dashboard'dan set et:
  ```bash
  eas secret:create --scope project --name APPLE_ID_EMAIL --value "senin@apple.com"
  eas secret:create --scope project --name ASC_APP_ID --value "1234567890"
  eas secret:create --scope project --name APPLE_TEAM_ID --value "ABCDE12345"
  ```
- [ ] **A1** EAS submit config doldur (`eas.json` → bundle ID, Apple certs, keystore)
- [ ] **A2** App Store Connect'te uygulama oluştur, Privacy Policy URL gir: `https://learnaxia.com/privacy`
- [ ] **A3** Play Store Console'da uygulama oluştur, Privacy Policy URL gir
- [ ] **A4** App Store screenshots hazırla (6.5" iPhone, 12.9" iPad)
- [ ] **A5** Play Store screenshots hazırla (phone + tablet)
- [ ] **A6** `app.json` → `ios.bundleIdentifier` ekle, `ios.buildNumber` ekle
- [ ] **A7** `app.json` → `android.versionCode` ekle

### Domain / Deploy
- [ ] **D1** `NEXTAUTH_URL` → production domain'i yaz (örn. `https://learnaxia.com`)
- [ ] **D2** Vercel'de env variable'ları güncelle (özellikle `AUTH_SECRET`, Google OAuth)
- [ ] **D3** Railway production ortamında aynı env'leri set et
