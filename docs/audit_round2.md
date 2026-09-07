# Learnaxia — 2. Tarama Raporu
> 16–17 Haziran 2026 — Tüm maddeler kapatıldı ✅

---

## Durum Özeti

Tüm 9 madde kapatıldı. L1 tasarım tercihi olarak işaretlendi.

---

## 🟠 YÜKSEK — Hızla kapatılmalı

### H1 · `auth.config.ts` — Fallback "dummy" secret
**Sorun:** `secret: process.env.AUTH_SECRET || "dummy-secret-for-startup-avoiding-crash"` — production'da `AUTH_SECRET` boş olursa oturumlar bu sabit string ile imzalanır. Token sahtelenebilir.  
**Dosya:** `auth.config.ts:44`  
**Fix:** Fallback'i kaldır, yoksa production'da crash at:
```ts
secret: process.env.AUTH_SECRET ?? (() => { throw new Error('AUTH_SECRET is not set'); })(),
```

---

### H2 · Mobile Login — Soft-Delete Kontrolü Eksik
**Sorun:** `prisma.user.findUnique({ where: { email } })` — `deletedAt` alanı kontrol edilmiyor. Hesabını silen bir kullanıcı mobil API üzerinden giriş yapabilir.  
**Dosya:** `app/api/mobile/login/route.ts:61`  
**Fix:**
```ts
if (!user || !user.password || user.deletedAt) {
  return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
}
```

---

### H3 · AI Provider — Vision Feature `gpt-4o` Kullanıyor
**Sorun:** `analyzeImage` fonksiyonu `model: "gpt-4o"` kullanıyor ama provider Groq API'ye (`api.groq.com`) yönlendirilmiş. Groq `gpt-4o` modelini desteklemiyor — bu feature **tamamen broken** durumda.  
**Dosya:** `domains/ai/openai.provider.ts:342`  
**Fix:** Groq'un vision destekli modelini kullan: `"llama-4-scout-17b-16e-instruct"` veya ayrı bir OpenAI client oluştur.

---

## 🟡 ORTA — Market öncesi tamamlanması önerilen

### M1 · `app/layout.tsx` — `metadataBase` localhost Fallback
**Sorun:** `metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000")` — NEXTAUTH_URL boş olursa OG görselleri, canonical URL'ler `http://localhost:3000` üzerinden üretilir. SEO açısından kritik.  
**Dosya:** `app/layout.tsx:40`  
**Fix:** `"http://localhost:3000"` yerine `"https://learnaxia.com"` yaz.

---

### M2 · `dangerouslySetInnerHTML` — HTML Sanitization Eksik
**Sorun:** 3 yerde AI tarafından üretilen HTML doğrudan DOM'a yazılıyor, DOMPurify veya benzeri bir sanitizasyon uygulanmıyor. AI çıktısı manipüle edilirse XSS vektörü olabilir.  
**Dosyalar:**
- `components/notes/note-list.tsx:80`
- `app/dashboard/discover/discover-client.tsx:358`
- `app/dashboard/learning/j/[journeyId]/journey-player.tsx:266`  
**Fix:** `isomorphic-dompurify` veya `sanitize-html` paketi ekle, render öncesi sanitize et.

---

### M3 · AI Endpoint — `modify` route `error.message` Sızdırıyor
**Sorun:** `return NextResponse.json({ error: error.message || "..." }, { status: 500 })` — dahili hata mesajları client'a gönderiliyor.  
**Dosya:** `app/api/ai/learning-path/modify/route.ts:40`  
**Fix:** Generic mesajla değiştir.

---

### M4 · Mobile AI `generate-note` — `error.message` Sızdırıyor
**Sorun:** Aynı sorun — `error.message` client'a açık.  
**Dosya:** `app/api/mobile/ai/generate-note/route.ts:43`  
**Fix:** Generic mesajla değiştir.

---

## 🔵 DÜŞÜK — Bilgi

### L1 · `auth.config.ts` — `allowDangerousEmailAccountLinking: true`
**Sorun:** Bu seçenek, farklı OAuth sağlayıcılarla (Google gibi) aynı e-posta adresini kullanan hesapların otomatik birleştirilmesine izin veriyor. Account takeover vektörü olabilir ama bu bir tasarım tercihi.  
**Dosya:** `auth.config.ts:49`  
**Durum:** Kasıtlı olarak bırakılmışsa kabul edilebilir — sadece bilinçli olunmalı.

---

### L2 · `generate-slide` ve Cron Route — `console.log` Var
**Sorun:** Server-side `console.log` production'da gereksiz yere log üretiyor (generate-slide:55, cron:46,67). Bunlar log kirliliği yaratıyor.  
**Dosyalar:** `app/api/ai/learning-path/generate-slide/route.ts:55`, `app/api/cron/recalculate-scores/route.ts:46,67`  
**Not:** Cron log'ları işlevsel olduğu için bırakılabilir. generate-slide'dakini kaldır.

---

## 📋 ÖZET TABLO

| # | Seviye | Konu | Dosya |
|---|--------|------|-------|
| H1 | 🟠 | dummy secret fallback auth.config'de | auth.config.ts |
| H2 | 🟠 | Mobile login soft-delete kontrolü eksik | mobile/login/route.ts |
| H3 | 🟠 | Vision AI broken (gpt-4o on Groq = hata) | openai.provider.ts |
| M1 | 🟡 | metadataBase localhost fallback | layout.tsx |
| M2 | 🟡 | dangerouslySetInnerHTML sanitize yok | 3 dosya |
| M3 | 🟡 | modify route error.message leak | learning-path/modify |
| M4 | 🟡 | mobile generate-note error.message leak | mobile/ai/generate-note |
| L1 | 🔵 | allowDangerousEmailAccountLinking | auth.config.ts |
| L2 | 🔵 | generate-slide console.log | generate-slide/route.ts |

---

> **Önceki turdan kalan:** Sıfır kritik. Tüm 25 madde kapatıldı.  
> **Bu turda:** 3 yüksek + 4 orta + 2 düşük = **9 madde**
