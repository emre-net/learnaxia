# Learnaxia — Market Readiness Report

> Tüm kod tabanı incelenerek hazırlanan kapsamlı eksik analizi.  
> Her başlık **önceliğe** göre sıralanmıştır: 🔴 Kritik → 🟡 Önemli → 🟢 Nice-to-have

---

## 🔴 1. GÜVENLİK — Kritik Açıklar

### 1.1 Env Dosyasında Açık Kimlik Bilgileri
**Dosya:** [.env](file:///C:/lrx/apps/web/.env)

```
AUTH_SECRET="secret-key-placeholder-replace-me"   ← Sahte secret
ADMIN_PASSWORD="Emre1863"                          ← Plain-text şifre
GOOGLE_CLIENT_ID=""                                ← Boş — Google login çalışmıyor
GOOGLE_CLIENT_SECRET=""                            ← Boş
GROQ_API_KEY="gsk_G0Www..."                        ← Hard-coded API anahtarı
CRON_SECRET eksik                                  ← Cron endpoint korumasız
```

> [!CAUTION]
> `.env` dosyası **asla** repository'e push edilmemeli. `AUTH_SECRET` production'da mutlaka güçlü bir değerle değiştirilmeli.

- [ ] `AUTH_SECRET` → `openssl rand -base64 32` ile yeni değer üret
- [ ] `ADMIN_PASSWORD` → DB'ye bcrypt hashli kaydet, env'den kaldır
- [ ] `GOOGLE_CLIENT_ID/SECRET` → Google Console'dan doldur
- [ ] `CRON_SECRET` → üret ve ekle
- [ ] `.env.example` dosyası oluştur (değerler olmadan sadece key'ler)

---

### 1.2 Admin Şifresi Plain-Text Karşılaştırılıyor
**Dosya:** [auth.ts:65](file:///C:/lrx/apps/web/auth.ts#L65)

```ts
if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD)
```

Eğer `.env` sızarsa admin hesabı anında ele geçirilebilir.

- [ ] Admin şifresini bcrypt hashle, DB'ye kaydet, plain-text karşılaştırmayı kaldır

---

### 1.3 Rate Limiting Eksik Uç Noktalar

**Mevcut:** Sadece `/mobile/login`, `/mobile/register`, `/ai/generate`, `/ai/solve-photo`'da rate limit var.

**Eksik:**
- `/api/scores/me` — spam istek ile cache bypass
- `/api/leaderboard` — her çağrıda ağır DB query
- `/api/notes/*`, `/api/modules/*` — DDoS'a açık

- [ ] `checkRateLimit()` tüm write endpoint'lerine ekle
- [ ] Leaderboard endpoint'ini IP bazlı rate limit'e al

---

### 1.4 Email Doğrulama Devre Dışı
**Dosya:** [auth.ts:97](file:///C:/lrx/apps/web/auth.ts#L97)

```ts
// if (!user.emailVerified) return null; // Disabled for MVP
```

Herhangi bir e-posta adresiyle kayıt yapılıp doğrulama yapılmadan giriş yapılabiliyor.

- [ ] Email verification flow aktif et — Resend API zaten entegre

---

### 1.5 wipe-db Endpoint'i Production'da Mevcut

`/api/admin/wipe-db` production'da aktif. Role kontrolü var ama yeterli değil.

- [ ] `wipe-db` endpoint'ini production build'den tamamen çıkar veya IP whitelist uygula

---

## 🔴 2. YASAL UYUMLULUK — Kritik

### 2.1 Gizlilik Politikası Yetersiz
**Dosya:** [privacy/page.tsx](file:///C:/lrx/apps/web/app/privacy/page.tsx)

Mevcut: 4 başlık, her biri 1-2 cümle. Türkiye'de **KVKK** ve uluslararası için **GDPR** kapsamında çok yetersiz.

**Eksik maddeler:**
- Hangi veriler ne kadar süre saklanıyor?
- Kullanıcı hakları (erişim, silme, taşıma, itiraz)
- Veri işleme hukuki dayanağı
- Üçüncü taraf entegrasyonlar (Google OAuth, Groq AI, Resend, Railway)
- AI'nın kullanıcı içeriklerini nasıl işlediği
- Scoring sisteminin topladığı veriler
- Çerez politikası detayları
- DPA (Veri Sorumlusu) iletişim bilgileri
- Uluslararası veri transferi (sunucu lokasyonu)
- Güvenlik ihlali bildirimi prosedürü

> [!IMPORTANT]
> App Store ve Play Store yayını için geçerli gizlilik politikası URL'si zorunlu. Yetersiz olursa uygulama reddedilebilir.

- [ ] Kapsamlı KVKK/GDPR uyumlu gizlilik politikası yaz (en az 15-20 madde)
- [ ] Ayrı cookie politikası sayfası ekle

---

### 2.2 Kullanım Şartları Yetersiz
**Dosya:** [terms/page.tsx](file:///C:/lrx/apps/web/app/terms/page.tsx)

Mevcut: 4 başlık. App marketleri için yetersiz.

**Eksik maddeler:**
- Yaş sınırı (COPPA — 13 yaş altı veri toplama)
- Kullanıcı tarafından oluşturulan içerik hakları
- Yasak içerik politikası
- Hesap askıya alma/silme koşulları
- Abonelik / ücretli hizmet koşulları (şema'da var ama yazılı değil)
- İade politikası
- Yargı yetkisi (hangi ülke hukuku geçerli)
- Hizmet değişiklik bildirimi süresi
- Fikri mülkiyet ihlali bildirimi
- Anlaşmazlık çözümü

---

### 2.3 Cookie Consent Banner Yok

Platform next-auth session cookie kullanıyor ama kullanıcıya onay gösterilmiyor.

- [ ] Basit cookie consent banner ekle
- [ ] `localStorage`'da tercih kaydet

---

### 2.4 App Store / Play Store İçin Zorunlu Sayfalar Eksik

- Hesap silme sayfası — **Apple zorunlu kılıyor (App Store Review Guideline 5.1.1)**
- Veri dışa aktarma — GDPR/KVKK zorunluluğu

---

## 🔴 3. EKSİK CORE ÖZELLİKLER

### 3.1 Şifre Sıfırlama — Mobil Sahte Çalışıyor
**Dosya:** [login.tsx:72](file:///C:/lrx/apps/mobile/app/login.tsx#L72)

```ts
// TODO: API entegrasyonu — /mobile/forgot-password
Alert.alert('Gönderildi', ...); // Sahte mesaj! Mail gitmiyor.
```

Kullanıcı şifresini unuttuğunda "Gönderildi" mesajı görüyor ama hiçbir şey olmuyor.

- [ ] `/api/mobile/forgot-password` endpoint'i oluştur
- [ ] Resend ile şifre sıfırlama maili gönder
- [ ] Token doğrulama + web reset-password sayfasıyla entegre et

---

### 3.2 Bildirim Ayarları Stub
**Dosya:** [profile.tsx:254](file:///C:/lrx/apps/mobile/app/(tabs)/profile.tsx#L254)

```ts
// TODO: Bildirim ayarları
```

- [ ] Push notification izin akışı
- [ ] Expo Notifications entegrasyonu
- [ ] SM-2 hatırlatıcıları

---

### 3.3 Dil Değiştirme Stub
**Dosya:** [profile.tsx:234](file:///C:/lrx/apps/mobile/app/(tabs)/profile.tsx#L234)

```ts
// TODO: Dil değiştirme ekranı
```

- [ ] Dil seçim modal'ı + `useLanguage` hook'una kaydetme

---

### 3.4 Hesap Silme Yok

Ne web ne mobil'de hesap silme yok. Apple/Google zorunlu kılıyor.

- [ ] `DELETE /api/user/account` — soft delete + 30 gün sonra hard delete
- [ ] Web Settings sayfasına "Hesabımı Sil" bölümü
- [ ] Mobil profil'e hesap silme seçeneği

---

### 3.5 Abonelik / Ödeme Sistemi Tamamlanmamış

Schema'da `Plan`, `Subscription`, `Invoice`, `PaymentMethod` modelleri var ama:
- Stripe webhook handler yok
- Abonelik satın alma akışı yok
- Plan limitleri uygulanmıyor
- Fiyatlandırma sayfası yok

---

## 🟡 4. UX / KULLANICI DENEYİMİ

### 4.1 Onboarding Akışı Yok

Yeni kullanıcı kayıt sonrası direkt dashboard'a atılıyor.

- [ ] 3 adımlık onboarding: İlgi alanı seç → İlk modül → SM-2 tanıtımı
- [ ] `settings.onboardingComplete` flag'i ile bir kez göster

---

### 4.2 Boş Durum Tasarımı Eksik

Library, Discover vb. ilk açılışta boş. Yönlendirici CTA yok.

---

### 4.3 Public Profil Sayfası Yok

Liderboard'da görünen kullanıcılara tıklanamıyor. `/u/[handle]` route yok.

---

### 4.4 Mobil Create Tab Placeholder

**Dosya:** [create_placeholder.tsx](file:///C:/lrx/apps/mobile/app/(tabs)/create_placeholder.tsx) — 132 byte, içerik yok.

Mobilden modül oluşturma akışı çalışmıyor.

---

### 4.5 Push Notification / Hatırlatıcı Yok

SM-2 sistemi var ama "Bugün X kartın var" bildirimi yok.

---

## 🟡 5. TEKNİK BORÇ

### 5.1 Log Dosyaları Repository'de
`crash_dump.txt` (144 KB) ve `crash_log.txt` (300 KB) commit'li.
- [ ] `.gitignore`'a `*.txt` ve `crash_*` ekle

### 5.2 EAS Submit Konfigürasyonu Boş
```json
"submit": { "production": {} }
```
App Store / Play Store gönderimi için gerekli credential'lar eksik.

### 5.3 `newArchEnabled: false`
Yeni React Native mimarisi devre dışı. Performans iyileştirmeleri kaçırılıyor.

### 5.4 `supportsTablet: true` — Tablet UI Yok
Tablet desteği bildirilmiş ama UI optimize edilmemiş. App Store incelemesinde sorun çıkabilir.

### 5.5 Scoring Migration Henüz Uygulanmadı
`user_scores`, `study_session_logs`, `content_adoption_logs` tabloları DB'de henüz yok.
- [ ] Railway aktif olunca: `npx prisma migrate dev --name add_momentum_scoring`

### 5.6 `prisma generate` CI Pipeline'a Entegre Edilmeli
Deploy sürecinde otomatik çalışması gerekiyor.

---

## 🟡 6. SEO / WEB VİZİBİLİTESİ

| Eksik | Etki |
|-------|------|
| `/sitemap.xml` yok | Arama motorları sayfaları bulamıyor |
| `/robots.txt` yok | Dashboard indexlenebilir |
| OG image yok | Sosyal medya önizlemesi yok |
| Fiyatlandırma sayfası yok | Conversion kaçırılıyor |
| Landing'de Testimonials / SSS yok | SEO + güven sinyali eksik |

- [ ] `app/sitemap.ts` oluştur (Next.js native)
- [ ] `app/robots.ts` oluştur — dashboard'u engelle
- [ ] OG image oluştur ve `layout.tsx`'e ekle

---

## 🟢 7. NICE-TO-HAVE (Sonraki Sürüm)

| # | Özellik |
|---|---------|
| 7.1 | Dark/light tema toggle mobil'de |
| 7.2 | Modül fork/kopyalama UI akışı (`isForkable` şema'da mevcut) |
| 7.3 | Export (PDF/CSV) öğrenme istatistikleri |
| 7.4 | Referral programı ("Arkadaşını davet et") |
| 7.5 | Mobil offline çalışma (cached modüller) |
| 7.6 | Accessibility (a11y) — ekran okuyucu desteği |
| 7.7 | In-app rating prompt (App Store yorumları için) |
| 7.8 | AB test altyapısı |
| 7.9 | Admin analytics dashboard — kullanıcı büyüme grafikleri |
| 7.10 | Webhook / entegrasyon sistemi |

---

## 📋 SIRALANMIŞ AKSİYON PLANI

### Hafta 1 — Güvenlik + Yasal (Deploy Blocker)
- [ ] **S1** `AUTH_SECRET` güçlü değerle değiştir
- [ ] **S2** `GOOGLE_CLIENT_ID/SECRET` Google Console'dan doldur
- [ ] **S3** `CRON_SECRET` üret, env'e ekle
- [ ] **S4** Email doğrulamayı aktif et (`auth.ts:97` yorumu kaldır)
- [ ] **S5** `wipe-db` endpoint'ini production'dan çıkar
- [ ] **L1** KVKK/GDPR uyumlu gizlilik politikası (15+ madde)
- [ ] **L2** Kapsamlı kullanım şartları (10+ madde)
- [ ] **L3** Cookie consent banner

### Hafta 2 — Eksik Özellikler (Store Blocker)
- [ ] **F1** Hesap silme endpoint + Settings UI + Mobil UI
- [ ] **F2** Mobil şifre sıfırlama — gerçek API bağlantısı
- [ ] **F3** Scoring DB migration (Railway aktif olunca)
- [ ] **F4** Onboarding akışı (en az 2 adım)

### Hafta 3 — Store Hazırlık
- [ ] **A1** EAS submit konfigürasyonu (bundle ID, Apple certs, keystore)
- [ ] **A2** App Store / Play Store screenshots hazırla
- [ ] **A3** Privacy Policy URL'sini store formlarına gir
- [ ] **A4** `sitemap.ts` + `robots.ts`
- [ ] **A5** OG image ekle

### Hafta 4 — Kalite
- [ ] **Q1** Push notification sistemi (Expo Notifications)
- [ ] **Q2** Boş durum tasarımları (Library, Discover)
- [ ] **Q3** `crash_*.txt` dosyalarını `.gitignore`'a ekle
- [ ] **Q4** `.env.example` dosyası oluştur

---

## 🏁 Hazırlık Skoru

| Kategori | Durum | Not |
|----------|-------|-----|
| Güvenlik | 🔴 %40 | AUTH_SECRET, Google OAuth, email verify kritik |
| Yasal Uyumluluk | 🔴 %20 | Gizlilik + ToS tamamen yeniden yazılmalı |
| Core Özellikler | 🟡 %65 | Hesap silme + şifre sıfırlama + bildirim eksik |
| UX / Onboarding | 🟡 %40 | Onboarding + empty states + public profil yok |
| Store Hazırlık | 🔴 %30 | EAS config + screenshots + privacy URL eksik |
| Teknik Kalite | 🟡 %70 | TS temiz, mimari sağlam, migration bekliyor |
| SEO | 🟡 %30 | Sitemap + robots + OG image yok |

> **Genel:** Platform teknik altyapısı güçlü ve özgün özellikler iyi çalışıyor.
> Markete çıkmak için **Hafta 1 + Hafta 2 listesi** tamamlanmadan gönderim riske girilebilir.
