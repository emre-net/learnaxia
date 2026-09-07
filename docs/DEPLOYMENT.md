# 🚀 Learnaxia Sunucu Kurulum Rehberi (Railway + PostgreSQL)

Bu rehber, Learnaxia projenizi Railway.app (bizim için en uygun sunucu) üzerine kurmanız için adım adım hazırlanmıştır.

## 1. Hazırlık (Başlamadan Önce)
1.  **GitHub Hesabı:** Kodlarınızın GitHub'da olması gerekiyor.
2.  **Railway Hesabı:** [valid url](railway.app) adresine gidin ve "Login with GitHub" diyerek giriş yapın.

## 2. Kodu GitHub'a Gönder (Push)
Ben zaten projeyi senin bilgisayarında güncelledim. Eğer henüz GitHub'a yüklemediysen terminale şunları yazarak gönderebilirsin:
*(Eğer nasıl yapacağını bilmiyorsan bana sor, hallederim)*

## 3. Railway'de Proje Oluşturma
1.  [valid url](Railway Dashboard) (Ana Sayfa) ekranına git.
2.  Sağ üstteki **"New Project"** butonuna tıkla.
3.  **"Deploy from GitHub repo"** seçeneğini seç.
4.  Listeden **`learnaxia`** (veya projenin GitHub adı neyse) onu seç.
5.  **ÖNEMLİ:** Hemen "Deploy Now" deme! Veritabanını eklememiz lazım.
    *   Eğer otomatik başlarsa panik yapma, hata verecektir, sorun değil.

## 4. Veritabanı (PostgreSQL) Ekleme
1.  Railway proje ekranında (büyük boş kutular olan ekran), boş bir yere sağ tıkla veya **"+ New"** butonuna bas.
2.  **"Database"** -> **"PostgreSQL"** seç.
3.  Bir kutucuk eklenecek ve kurulum başlayacak. Birkaç saniye bekle.

## 5. Uygulamayı Veritabanına Bağlama
1.  Ekrandaki **PostgreSQL** kutusuna tıkla.
2.  **"Connect"** sekmesine gel.
3.  Orada **`DATABASE_URL`** yazan yerde upuzun bir link göreceksin. (Şöyle başlar: `postgresql://postgres:password...`).
4.  O linkin yanındaki "Copy" iconuna basıp kopyala.
5.  Şimdi ekrandaki diğer kutuya (**Next.js Uygulaman**) tıkla.
6.  **"Settings"** -> **"Variables"** sekmesine gel.
7.  **"New Variable"** butonuna bas:
    *   **VARIABLE_NAME:** `DATABASE_URL` yaz.
    *   **VALUE:** Kopyaladığın o uzun linki yapıştır.
    *   **Add** de.

## 6. Şifreleri Ayarlama (Auth Secrets)
Giriş sisteminin çalışması için gizli şifreleri eklemelisin.
Yine **"Variables"** ekranındayken şunları ekle:

1.  **`AUTH_SECRET`**
    *   Değer olarak rastgele uzun ve karmaşık bir şeyler yaz (örn: `burasicokgizli123456789`).

2.  **`AUTH_URL`**
    *   Bu, sitenin adresi olacak. Railway sana `https://learnaxia-production.up.railway.app` gibi bir adres verecek. (Settings -> Domains kısmında yazar).
    *   İstersen şimdilik ekleme, site açılınca ekleyip tekrar başlatırız.

3.  **Google Giriş Ayarları:**
    *   **`GOOGLE_CLIENT_ID`**: (Senin elindeki ID)
    *   **`GOOGLE_CLIENT_SECRET`**: (Senin elindeki Gizli Şifre)
    *   **ÇOK ÖNEMLİ:** Google Cloud Console sayfasına gidip, "Authorized redirect URIs" kısmına sitenin yeni adresini eklemelisin!
        *   Örn: `https://senin-projen.up.railway.app/api/auth/callback/google`

## 7. Derleme Komutu (Build Command)
Railway'in veritabanı kodlarını oluşturması için bir ayar yapmamız lazım.
1.  Next.js uygulamanın kutusuna tıkla.
2.  **"Settings"** -> **"Build"** kısmına gel.
3.  Aşağı inip **"Build Command"** satırını bul.
4.  Oraya şunu yapıştır: `npx prisma generate && next build`

## 8. Final ve Başlatma
1.  Her şeyi yaptıysan Railway genelde otomatik algılar ve yeniden başlatır.
2.  Başlatmazsa sağ üstten **"Redeploy"** diyebilirsin.
3.  **Veritabanını Güncelleme (Migration):**
    *   Site açılınca bana haber ver, veritabanı tablolarını oluşturmak için sana tek satırlık bir komut vereceğim. (Bilgisayarından uzaktaki sunucuya göndereceğiz).

Kolay gelsin! Takıldığın yer olursa buradayım. 🚀
