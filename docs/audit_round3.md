# Learnaxia — 3. Tarama Raporu
> 17 Haziran 2026 — İki tur kapsamında 34 madde kapatıldıktan sonra

---

## Durum Özeti

2 yüksek + 4 orta + 3 düşük = **9 yeni madde.**  
Kritik seviyede hiçbir yeni bulgu yok.  
Uygulama artık çok iyi bir durumda.

---

## 🟠 YÜKSEK

### H1 · `start/route.ts` — Hata Mesajı Response'a Gömülüyor
**Sorun:** `return NextResponse.json({ error: "Sunucu hatası: Yolculuk başlatılamadı. (" + errorMsg + ")" })` — dahili hata detayı (`errorMsg`) client'a sızdırılıyor.  
**Dosya:** `app/api/ai/learning-path/start/route.ts:95`  
**Fix:** Generic mesaj kullan, `errorMsg` yalnızca SystemLog'a düşsün.

---

### H2 · `register/route.ts` — `error.message` Response'ta
**Sorun:** `{ error: error.message || "..." }` — kayıt sırasında oluşan iç hata mesajı client'a sızdırılıyor (örn. unique constraint detayları).  
**Dosya:** `app/api/auth/register/route.ts:106`  
**Fix:** Generic mesajla değiştir.

---

## 🟡 ORTA

### M1 · `lib/mail.ts` — Resend Dummy Key + localhost URL
**Sorun 1:** `process.env.RESEND_API_KEY || "re_build_dummy_key"` — `RESEND_API_KEY` boş olursa hiçbir e-posta gitmez ama hata da fırlatılmaz; e-posta gönderimi sessizce başarısız görünür.  
**Sorun 2:** `process.env.AUTH_URL || "http://localhost:3000"` — e-postada gönderilen doğrulama linki localhost olabilir.  
**Dosya:** `lib/mail.ts:4,9`  
**Fix:**
- `AUTH_URL` fallback'ini `"https://learnaxia.com"` yap.
- `RESEND_API_KEY` yoksa `console.error` ile uyar (crash attırma, email feature kapalı olabilir).

---

### M2 · `file/extract/route.ts` (web) — `error.message` Response'ta
**Sorun:** `error.message || "Sunucu hatası oluştu."` — dosya işleme hatası detayı client'a gönderilir (path bilgisi, buffer detayı vb.).  
**Dosya:** `app/api/file/extract/route.ts:48`  
**Fix:** Generic mesajla değiştir.

---

### M3 · `mobile/file/extract` — Aynı Sorun
**Sorun:** Aynı `error.message` sızıntısı mobil extract route'unda da var.  
**Dosya:** `app/api/mobile/file/extract/route.ts:55`  
**Fix:** Generic mesajla değiştir.

---

### M4 · `mobile/ai/solve-photo` — `AIError.message` Client'a Gönderiliyor
**Sorun:** `AIError` tipindeki hatalarda `error.message` ve `error.code` client'a açık şekilde döndürülüyor. `error.message` çoğu zaman güvenlidir ama Groq/AI provider iç hataları da bu path'ten geçiyor.  
**Dosya:** `app/api/mobile/ai/solve-photo/route.ts:63`  
**Durum:** AIError mesajları kullanıcıya rehberlik için tasarlanmış — bu kabul edilebilir bir trade-off. Ancak Groq'un raw hata mesajları bu path'ten geçebilir.

---

## 🔵 DÜŞÜK

### L1 · `lib/auth/mobile-refresh.ts` — `MOBILE_REFRESH_TOKEN_PEPPER` Tanımlı ama Kullanılmıyor
**Sorun:** `.env.example`'da `MOBILE_REFRESH_TOKEN_PEPPER` var ama `mobile-refresh.ts`'de bu değer hiç kullanılmıyor. Refresh token hash'i salt SHA-256 — pepper yok. Hem yanıltıcı hem de eksik güvenlik katmanı.  
**Dosya:** `lib/auth/mobile-refresh.ts:110`  
**Fix:** PEPPER'ı hashToken'a ekle: `crypto.createHash('sha256').update(token + pepper).digest('hex')`

---

### L2 · `auth.ts` — `linkAccount` Event'inde Gereksiz `console.log`
**Sorun:** `console.log("[Auth Event] Account linked for user:", user.email)` — e-posta adresi sunucu log'una yazılıyor.  
**Dosya:** `auth.ts:142`  
**Fix:** Kaldır veya e-postayı loglamayan bir formata çevir.

---

### L3 · `domains/module/library.service.ts` — `console.log` UserID Sızıntısı
**Sorun:** `console.log("[LibraryService] Fetching paginated library for user: ${userId}...")` — userId her istek için log'a düşüyor. Production'da gereksiz.  
**Dosya:** `domains/module/library.service.ts:9`  
**Fix:** Kaldır.

---

### L4 · `domains/ai/openai.provider.ts` — Birden Fazla `console.log`
**Sorun:** Checker AI durumlarında 3 adet `console.log` var. Bu bilgiler zaten DB'de SystemLog'a kaydediliyor — konsol çıktısı gereksiz.  
**Dosyalar:** `openai.provider.ts:117,183,186`  
**Fix:** Kaldır veya `console.debug` ile sınıflandır.

---

### L5 · `eas.json` — iOS Submit Placeholder'ları Doldurmamış
**Sorun:** `appleId: "APPLE_ID_EMAIL_HERE"`, `ascAppId: "APP_STORE_CONNECT_APP_ID_HERE"` — EAS submit çalışmayacak.  
**Dosya:** `apps/mobile/eas.json:32-34`  
**Fix:** App Store Connect'ten gerçek değerleri al ve doldur. (Railway adımının ardından App Store'a submit için gerekli)

---

## 📋 ÖZET TABLO

| # | Seviye | Konu | Dosya |
|---|--------|------|-------|
| H1 | 🟠 | start route — errorMsg client'a sızdırılıyor | learning-path/start |
| H2 | 🟠 | register route — error.message client'a sızdırılıyor | auth/register |
| M1 | 🟡 | mail.ts — dummy Resend key + localhost URL | lib/mail.ts |
| M2 | 🟡 | file/extract (web) — error.message leak | file/extract |
| M3 | 🟡 | mobile/file/extract — error.message leak | mobile/file/extract |
| M4 | 🟡 | mobile/solve-photo — AIError.message açık | mobile/ai/solve-photo |
| L1 | 🔵 | PEPPER env var tanımlı ama kullanılmıyor | mobile-refresh.ts |
| L2 | 🔵 | auth.ts linkAccount event — e-posta loguyor | auth.ts |
| L3 | 🔵 | LibraryService — userId console.log | library.service.ts |
| L4 | 🔵 | openai.provider.ts — 3 adet console.log | openai.provider.ts |
| L5 | 🔵 | eas.json — iOS submit placeholder'ları boş | eas.json |

---

## ✅ GEÇMİŞ TUR DEĞERLENDİRMESİ

| Tur | Bulunan | Durum |
|-----|---------|-------|
| Tur 1 | 25 madde | ✅ Tümü kapatıldı |
| Tur 2 | 9 madde | ✅ Tümü kapatıldı |
| Tur 3 | 9 madde | ⏳ Bu rapora bakılıyor |

