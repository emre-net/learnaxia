# Learnaxia — Launch Öncesi Manuel Adımlar
> Kod tarafı tamamen hazır. Bu belge yalnızca senden aksiyon bekleyen adımları içerir.
> Birkaç günde tamamlanabilir.

---

## 1. Railway — Environment Variables

Railway dashboard'una gir → **Learnaxia web servisi** → **Variables** sekmesi.
Her değeri buraya ekle:

### 1.1 · AUTH_SECRET (Zorunlu — önce bunu yap)

NextAuth oturumlarını imzalar. Boşsa uygulama açılmaz.

```bash
# Terminalde üret:
openssl rand -base64 32
```

Çıktıyı Railway'de `AUTH_SECRET` adıyla kaydet.

---

### 1.2 · NEXTAUTH_URL

```
NEXTAUTH_URL = https://learnaxia.com
```

---

### 1.3 · MOBILE_JWT_SECRET

```bash
openssl rand -base64 32
```

Railway'de `MOBILE_JWT_SECRET` adıyla kaydet.

---

### 1.4 · MOBILE_REFRESH_TOKEN_PEPPER

```bash
openssl rand -hex 32
```

Railway'de `MOBILE_REFRESH_TOKEN_PEPPER` adıyla kaydet.

> ⚠️ Bu değeri sonradan değiştirme! Değişirse tüm kullanıcıların mobil refresh token'ları geçersiz olur ve herkes yeniden login yapmak zorunda kalır.

---

### 1.5 · CRON_SECRET

Gece çalışan skor hesaplama cron'unu korur.

```bash
openssl rand -hex 32
```

Railway'de `CRON_SECRET` adıyla kaydet.

Railway'de **Cron Job** olarak şunu ekle:
- **Schedule:** `0 2 * * *` (her gece 02:00 UTC)
- **Command:** `curl -X POST https://learnaxia.com/api/cron/recalculate-scores -H "x-cron-secret: CRON_SECRET_DEGERIN"`

---

### 1.6 · SYNC_SECRET

```bash
openssl rand -hex 32
```

Railway'de `SYNC_SECRET` adıyla kaydet.

---

### 1.7 · ADMIN_EMAIL + NEXT_PUBLIC_ADMIN_EMAIL

Admin paneline erişecek e-posta adresin.

```
ADMIN_EMAIL = senin@email.com
NEXT_PUBLIC_ADMIN_EMAIL = senin@email.com
```

---

### 1.8 · DATABASE_URL

Railway PostgreSQL eklentisi kuruluysa otomatik gelir. Yoksa:
- Railway dashboard → **Add Service** → **PostgreSQL**
- Oluşturunca `DATABASE_URL` otomatik inject edilir.

---

## 2. Google OAuth Kurulumu

Web ve mobil Google ile giriş için gerekli.

1. [console.cloud.google.com](https://console.cloud.google.com) adresine git
2. Yeni bir **Project** oluştur → isim: `Learnaxia`
3. Sol menü → **APIs & Services** → **Credentials**
4. **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized redirect URIs** ekle:
   ```
   https://learnaxia.com/api/auth/callback/google
   ```
7. Oluştur → **Client ID** ve **Client Secret** kopyala

Railway'e ekle:
```
GOOGLE_CLIENT_ID     = aldığın client ID
GOOGLE_CLIENT_SECRET = aldığın client secret
```

---

## 3. Groq API Key (Production)

1. [console.groq.com](https://console.groq.com) adresine git
2. **API Keys** → **Create API Key**
3. İsim: `learnaxia-production`
4. Kopyala

Railway'e ekle:
```
GROQ_API_KEY = gsk_...
```

> Mevcut key'i sil veya güncelle — development ortamında kullanılan key production'a taşınmamalı.

---

## 4. Resend E-posta Kurulumu

Kullanıcı doğrulama ve şifre sıfırlama e-postaları için.

1. [resend.com](https://resend.com) adresine git → hesap aç
2. **Domains** → **Add Domain** → `learnaxia.com` ekle
3. Resend'in verdiği DNS kayıtlarını (SPF, DKIM, DMARC) domain sağlayıcında ekle
4. Doğrulandıktan sonra **API Keys** → **Create API Key**
5. Kopyala

Railway'e ekle:
```
RESEND_API_KEY = re_...
MAIL_FROM      = Learnaxia <no-reply@learnaxia.com>
AUTH_URL       = https://learnaxia.com
```

> `hello@learnaxia.com` adresini de Resend'den aktifleştir — privacy/terms sayfalarında bu adres görünüyor. Gelen mailleri kendi e-postana yönlendir.

---

## 5. Prisma Migration (Railway Deploy Sonrası)

Railway'e ilk deploy yaptıktan sonra bir kez çalıştırılmalı.
Yeni `LearningJourney` index'leri ve tüm schema değişiklikleri uygulanır.

```bash
# Yerel terminalden (DATABASE_URL'i Railway'den al):
$env:DATABASE_URL="postgresql://..."
npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma
```

Veya Railway'de **Deploy** → **Run Command** ile:
```bash
npx prisma migrate deploy
```

---

## 6. App Store (iOS) Hazırlığı

### 6.1 · Apple Developer Hesabı
- [developer.apple.com](https://developer.apple.com) → kayıt (yıllık $99)
- Hesap onaylanınca devam et

### 6.2 · App Store Connect'te Uygulama Oluştur
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
2. Platform: iOS
3. Bundle ID: `com.learnaxia.app`
4. SKU: `learnaxia-ios-001`
5. **Privacy Policy URL:** `https://learnaxia.com/privacy`

### 6.3 · EAS Submit Credentials
```bash
# EAS CLI kur (yoksa):
npm install -g eas-cli

# Giriş yap:
eas login

# Secret'ları kaydet:
eas secret:create --scope project --name APPLE_ID_EMAIL --value "apple_hesabı@email.com"
eas secret:create --scope project --name ASC_APP_ID   --value "1234567890"  # App Store Connect App ID
eas secret:create --scope project --name APPLE_TEAM_ID --value "ABCDE12345" # Apple Team ID

# ASC App ID nerede bulunur:
# App Store Connect → My Apps → Learnaxia → App Information → Apple ID
# Apple Team ID: developer.apple.com → Membership → Team ID
```

### 6.4 · Production Build ve Submit
```bash
cd apps/mobile

# iOS production build:
eas build --platform ios --profile production

# Submit (build tamamlandıktan sonra):
eas submit --platform ios --latest
```

### 6.5 · App Store'da Tamamlanması Gerekenler
- **Screenshots:** 6.5" iPhone (1284×2778) ve 12.9" iPad (2048×2732) — en az 3'er adet
- **App Description:** Türkçe ve İngilizce
- **Keywords:** learnaxia, yapay zeka, öğrenme, flashcard, spaced repetition
- **Age Rating:** 4+
- **Category:** Education

---

## 7. Play Store (Android) Hazırlığı

### 7.1 · Google Play Developer Hesabı
- [play.google.com/console](https://play.google.com/console) → kayıt (tek seferlik $25)

### 7.2 · Uygulama Oluştur
1. **Create App** → isim: Learnaxia
2. **Privacy Policy:** `https://learnaxia.com/privacy`
3. **App Category:** Education
4. **Content Rating:** Questionnaire doldurunca otomatik gelir

### 7.3 · Google Service Account (EAS için)
1. [console.cloud.google.com](https://console.cloud.google.com) → **IAM & Admin** → **Service Accounts**
2. **Create Service Account** → isim: `eas-submit`
3. **Keys** → **Add Key** → **JSON** → indir → `apps/mobile/google-service-account.json` olarak kaydet
4. Play Console → **Setup** → **API access** → Service account'u davet et → **Release Manager** rolü ver

### 7.4 · Android Production Build ve Submit
```bash
cd apps/mobile

# Android production build:
eas build --platform android --profile production

# Submit:
eas submit --platform android --latest
```

### 7.5 · Play Store'da Tamamlanması Gerekenler
- **Screenshots:** Phone (1080×1920) ve 7" tablet — en az 2'şer adet
- **Feature Graphic:** 1024×500 banner
- **App Description:** TR ve EN
- **Short Description:** max 80 karakter

---

## 8. Domain E-posta Aktivasyonu

Privacy, Terms ve Contact sayfalarında `hello@learnaxia.com` adresi görünüyor.
Bu adresin çalışması gerekiyor (App Store review ekibinden mail gelebilir).

**Seçenek A — Resend ile:**
- Resend → **Domains** → `learnaxia.com` doğrulandıktan sonra `hello@learnaxia.com` → kendi e-postana yönlendir

**Seçenek B — Cloudflare Email Routing (ücretsiz):**
1. Cloudflare → domain → **Email** → **Email Routing**
2. **Create address:** `hello@learnaxia.com` → yönlendir: `senin_gercek@email.com`
3. Gelen tüm mailleri kendi kutunda görürsün

---

## 9. Sıralı Öncelik (Önerilen Sıra)

```
Gün 1:
  ✅ Railway env variables ekle (AUTH_SECRET, NEXTAUTH_URL, GROQ_API_KEY)
  ✅ Resend kurulumu + domain doğrulama
  ✅ hello@learnaxia.com yönlendirmesi

Gün 2:
  ✅ Google OAuth kurulumu
  ✅ Railway'e ilk deploy → prisma migrate deploy
  ✅ Uygulamayı test et (kayıt, giriş, AI, e-posta)

Gün 3:
  ✅ Apple Developer hesabı (onay 1-2 gün sürebilir — önceden başla!)
  ✅ App Store Connect'te uygulama oluştur
  ✅ EAS iOS build başlat

Gün 4-5:
  ✅ Google Play Console kurulumu
  ✅ Android build + submit
  ✅ App Store screenshots hazırla
  ✅ Submit → review (5-7 iş günü sürer)
```

---

## Hızlı Referans — Tüm Railway Env Variables

```env
AUTH_SECRET                  = openssl rand -base64 32
NEXTAUTH_URL                 = https://learnaxia.com
AUTH_URL                     = https://learnaxia.com
GOOGLE_CLIENT_ID             = console.cloud.google.com'dan
GOOGLE_CLIENT_SECRET         = console.cloud.google.com'dan
ADMIN_EMAIL                  = senin@email.com
NEXT_PUBLIC_ADMIN_EMAIL      = senin@email.com
GROQ_API_KEY                 = console.groq.com'dan
RESEND_API_KEY               = resend.com'dan
MAIL_FROM                    = Learnaxia <no-reply@learnaxia.com>
MOBILE_JWT_SECRET            = openssl rand -base64 32
MOBILE_REFRESH_TOKEN_PEPPER  = openssl rand -hex 32
CRON_SECRET                  = openssl rand -hex 32
SYNC_SECRET                  = openssl rand -hex 32
DATABASE_URL                 = Railway PostgreSQL'den otomatik gelir
```

