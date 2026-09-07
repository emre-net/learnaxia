# Learnaxia — Tam Etkileşim Haritası
> Her ekranda hangi tuşa basınca nereye gidildiği, hangi aksiyonun ne ürettiği

---

## 📱 MOBİL UYGULAMA

---

### 🔐 GİRİŞ AKIŞI

```
Uygulama açılır
│
├─ Token yoksa → Login Ekranı
│   ├─ [E-posta] + [Şifre] girişi
│   │   ├─ [Giriş Yap] → API /mobile/login → JWT + RefreshToken kaydedilir
│   │   │   ├─ Başarılı → Ana Tab (Home) ekranına geçiş
│   │   │   └─ Hata → Alert: "Geçersiz bilgiler"
│   │   │
│   │   └─ [Şifremi Unuttum] → Alert açılır
│   │       ├─ E-posta girilmişse → API /mobile/forgot-password → "Mail gönderildi"
│   │       └─ E-posta yoksa → "Önce e-posta girin" uyarısı
│   │
│   └─ [Hesap Oluştur] → Kayıt formu açılır (aynı ekranda toggle)
│       ├─ [Ad] + [E-posta] + [Şifre] (min 8 karakter)
│       └─ [Kayıt Ol] → API /mobile/register → Login ile aynı akış
│
└─ Token varsa → Profil fetch → Home Tab
```

---

### 🏠 TAB 1 — ANA SAYFA (Home)

```
Ana Sayfa
│
├─ Hero Banner (motivasyon cümlesi, döngüsel)
│
├─ İstatistik Kartları (4 kart)
│   ├─ Toplam Çalışma Süresi (dakika)
│   ├─ Başlanan Modül sayısı
│   ├─ Çözülen Soru sayısı
│   └─ Ortalama Doğruluk Oranı (%)
│
├─ 🎯 Focus Widget
│   ├─ Bugün hedeflenen çalışma süresi
│   └─ İlerleme göstergesi (ring/bar)
│
├─ 📅 Daily Review Widget
│   ├─ "Günlük Tekrar: X kart seni bekliyor"
│   └─ [Başla] → /study/daily (SM-2 tabanlı sıralı kart)
│
├─ Son Çalışılan Modüller (horizontal scroll)
│   └─ [Modül kartına bas] → /study/[id] ekranına gider
│
└─ Pull-to-Refresh → Tüm veriler yenilenir
```

---

### 📚 TAB 2 — KÜTÜPHANe (Library)

```
Kütüphane
│
├─ Tab geçişleri (3 tab)
│   ├─ [Modüller] ──────────────────────────────────────────────
│   │   ├─ Arama çubuğu → anlık filtreleme
│   │   ├─ Modül Kartı → [Karta bas] → StudyScreen /study/[id]
│   │   └─ Sonsuz scroll (12'şer yükleme)
│   │
│   ├─ [Koleksiyonlar] ──────────────────────────────────────────
│   │   ├─ Koleksiyon Kartı → /collections/[id]
│   │   │   ├─ İçindeki modülleri görüntüle
│   │   │   └─ [Modül] → StudyScreen
│   │   └─ [+ Yeni Koleksiyon] → /collections/new
│   │       ├─ Başlık + Açıklama gir
│   │       └─ [Oluştur] → API POST /mobile/collections
│   │
│   └─ [Notlar] ─────────────────────────────────────────────────
│       ├─ Not Kartı → /notes/[id]
│       │   ├─ Not içeriğini görüntüle (HTML render)
│       │   └─ [Düzenle] / [Sil]
│       └─ [+ Yeni Not] → /notes/new
│           ├─ Başlık + İçerik (manuel)
│           └─ [Kaydet] → API POST /mobile/notes
│
└─ Pull-to-Refresh
```

---

### 🔍 TAB 3 — KEŞFET (Explore)

```
Keşfet
│
├─ Tab geçişleri
│   ├─ [Modüller] → Herkese açık PUBLIC modüller
│   └─ [Koleksiyonlar] → PUBLIC koleksiyonlar
│
├─ Arama çubuğu → 500ms debounce → API'ye gönderilir
│   └─ Sonuçlar anlık güncellenir
│
└─ İçerik Kartı → [Karta bas]
    ├─ Modülse → StudyScreen /study/[id]
    └─ Koleksiyonsa → /collections/[id]
```

---

### ➕ TAB 4 — OLUŞTUR (Create)

```
Oluştur Ekranı
│
├─ 📷 [Fotoğraf Çek / Yükle] — Soru Çözücü
│   ├─ [Kamera İzni İste] → İzin verildi → kamera açılır
│   │   ├─ [📸 Çek] → Fotoğraf çekilir → önizleme
│   │   │   └─ [Gönder] → API POST /mobile/ai/solve-photo (Groq Vision)
│   │   │       ├─ AI çözümü gelir → SolutionModal açılır
│   │   │       │   ├─ Soru metni + AI çözümü gösterilir
│   │   │       │   ├─ [Not Olarak Kaydet] → /notes/[id]
│   │   │       │   └─ [Kapat]
│   │   │       └─ Hata → Alert (rate limit / dosya boyutu vb.)
│   │   └─ [Galeriden Seç] → ImagePicker → aynı akış
│   └─ İzin reddedildi → "Kamera erişimi gerekli" Alert
│
├─ 📄 [Belge Yükle] — PDF/TXT'den Not Üret
│   ├─ DocumentPicker → PDF veya TXT seç
│   ├─ API POST /mobile/file/extract → metin çıkarılır
│   ├─ API POST /mobile/ai/generate-note → AI not üretir
│   └─ Başarı → /notes/[id] ekranına geçiş
│
└─ 🧭 [Konu Gir] — Öğrenme Yolculuğu Oluştur
    ├─ TopicModal açılır → konu başlığı gir (min 3 karakter)
    ├─ [Oluştur] → API POST /ai/learning-path/generate (syllabus üretilir)
    │   └─ API POST /ai/learning-path/start (yolculuk başlar)
    │       └─ Başarı → Journey Player /journey/[id]
    └─ Hata → Alert
```

---

### 👤 TAB 5 — PROFİL

```
Profil Ekranı
│
├─ Avatar + Ad + E-posta + Handle
│
├─ Puan & Tier Kartı
│   ├─ Bu ayki puan
│   ├─ Tier: seed → sprout → sapling → oak → peak → apex
│   ├─ Tier progress bar (sonraki seviyeye kaç puan)
│   └─ [Detaylı Analiz] → /analytics ekranı
│
├─ Başarım Rozetleri (badges)
│   └─ Yatay scroll — kazanılan rozetler
│
├─ İstatistikler
│   ├─ Çalışma süresi
│   ├─ Modül sayısı
│   └─ Koleksiyon sayısı
│
├─ ⚙️ AYARLAR BÖLÜMÜ
│   ├─ [Dil] → ActionSheetIOS (iOS) / Alert (Android)
│   │   ├─ [Türkçe] → tüm uygulama Türkçe olur, API'ye gönderilir
│   │   └─ [English] → tüm uygulama İngilizce olur
│   │
│   ├─ [Bildirimler] → sistem izin kontrolü
│   │   ├─ İzin verilmişse → Sistem ayarlarına yönlendir
│   │   └─ İzin yoksa → "Ayarları Aç" Alert
│   │
│   ├─ [Gizlilik Politikası] → Linking.openURL → learnaxia.com/privacy
│   ├─ [Kullanım Şartları] → learnaxia.com/terms
│   └─ [İletişim] → learnaxia.com/contact veya mail
│
├─ 🚪 [Çıkış Yap] → Onay Alert → token silinir → Login ekranı
│
└─ 🗑️ [Hesabı Sil] — Tehlike Bölgesi
    ├─ Uyarı Alert (geri alınamaz)
    └─ [Onayla] → API DELETE /api/mobile/user/account
        ├─ Soft delete (email anonimleştirilir, 30 gün sonra hard delete)
        └─ Token silinir → Login ekranı
```

---

### 📊 ANALİZ EKRANI (/analytics)

```
Analiz Ekranı (Profile'dan açılır)
│
├─ Özet Kartlar
│   ├─ Toplam Çalışma Süresi
│   ├─ Toplam Çözülen Soru
│   ├─ Ortalama Doğruluk
│   └─ Streak (gün)
│
├─ 📈 Günlük Aktivite Grafiği (son 7 gün)
│   └─ Bar chart — gün / süre / çözülen soru
│
└─ Modül Bazlı İstatistikler
    ├─ Her modül için doğruluk oranı
    └─ [Modüle git] → StudyScreen
```

---

### 📖 ÇALIŞMA OTURUMU (/study/[id])

```
Çalışma Ekranı (herhangi bir karta basınca açılır)
│
├─ Progress Bar (kaçıncı kart / toplam)
├─ ⬅️ [Geri] → Oturumu sonlandır → kütüphaneye dön
│
├─ 🎴 Flashcard (3D flip animasyonu)
│   ├─ Ön yüz: Soru
│   ├─ [Kartı çevir / ekrana bas] → Cevap yüzüne döner (380ms flip)
│   └─ Cevap göründükten sonra 3 buton:
│       ├─ [❌ Bilmiyorum] quality=1 → SM-2 güncellenir, kart kısa sürede tekrar gelir
│       ├─ [— Zordu] quality=3 → orta aralıkta tekrar
│       └─ [✓✓ Kolay] quality=5 → SM-2 uzun aralık, Haptics tetiklenir
│
├─ 🔖 [Yer İmi] → optimistic UI, arka planda API'ye kaydedilir
│
└─ Oturum Tamamlanınca → Özet Ekranı
    ├─ Doğru / Toplam / Doğruluk %
    ├─ [Tekrar Çalış] → aynı oturumu yeniden başlat
    └─ [Kütüphaneye Dön]
```

---

### 📅 GÜNLÜK TEKRar (/study/daily)

```
Günlük Tekrar (SM-2 algoritmasi)
│
├─ Vadesi gelmiş kartlar sıralanır (SM-2 dueDate)
├─ Aynı Flashcard arayüzü
└─ Tamamlanınca → "Bugünlük tekrarlar bitti!" mesajı
```

---

### 🧭 YOLCULUK OYNATICI (/journey/[id])

```
Journey Player (Konu gir → Oluştur'dan açılır)
│
├─ Syllabus görünümü (konu başlıkları listesi)
├─ [Slayta Geç] → Slide view
│   ├─ Slayt içeriği (AI üretilmiş markdown/HTML)
│   ├─ [← Önceki] / [Sonraki →]
│   └─ Her slaytın altında: Peeking Sorusu
│       ├─ Soru gösterilir
│       └─ [Cevabı Gör] → cevap açılır
│
└─ Tüm slaytlar tamamlanınca → "Yolculuk Tamamlandı!" + puan güncelleme
```

---

---

## 🌐 WEB UYGULAMASI

---

### 🔐 AUTH AKIŞI (Web)

```
Landing Page (/)
│
├─ [Giriş Yap] → /login
│   ├─ E-posta + Şifre → NextAuth credentials
│   ├─ [Google ile Giriş] → OAuth flow → /dashboard
│   ├─ [Şifremi Unuttum] → /forgot-password
│   │   └─ Mail gönderilir → /auth/verify?token=... → şifre sıfırlama
│   └─ [Kayıt Ol] → /auth/register
│       ├─ Kullanıcı adı + E-posta + Şifre
│       ├─ Doğrulama maili gönderilir
│       └─ /auth/verify → hesap aktifleşir
│
├─ [Başla] / [Ücretsiz Dene] → /login
├─ [Gizlilik] → /privacy
├─ [Şartlar] → /terms
└─ [İletişim] → /contact
```

---

### 🏠 DASHBOARD (/dashboard)

```
Dashboard
│
├─ OnboardingModal (ilk girişte)
│   ├─ 4 adımlı tanıtım slaytı
│   └─ [Başla] → modal kapanır, onboardingComplete=true API'ye yazılır
│
├─ İstatistik Kartları (4 kart)
│   ├─ Çalışma Süresi
│   ├─ Başlanan Modül
│   ├─ Çözülen Soru
│   └─ Doğruluk Oranı
│
├─ 🎯 Focus Widget → bugünkü hedef / ilerleme
│
├─ 📅 Daily Review Widget
│   └─ [Günlük Tekrarı Başlat] → /study/daily
│
├─ 💰 Score Card
│   ├─ Bu ayki puan + tier
│   └─ [Liderboard] → /dashboard/leaderboard
│
└─ Admin ise → [Admin Panel] bağlantısı
```

---

### 📚 KÜTÜPHANE (/dashboard/library)

```
Kütüphane
│
├─ Filtre/Arama
│   ├─ Arama çubuğu (debounce)
│   ├─ Tür filtresi: Tümü / FLASHCARD / QUIZ / READING
│   ├─ Kategori filtresi
│   └─ Rol filtresi: Tümü / Oluşturduklarım / Kayıttediklerim
│
├─ Modül Kartı
│   ├─ [Çalış] → /study/[id] (web study player)
│   ├─ [Düzenle] → /dashboard/modules/[id] (OWNER ise)
│   └─ [Kaydet/Kaldır] → toggle save (SAVED/OWNER)
│
├─ [+ Yeni Modül] → /dashboard/create
│
└─ Pagination (12'şer)
```

---

### ✏️ MODÜL OLUŞTURMA (/dashboard/create)

```
Modül Oluştur
│
├─ Başlık + Açıklama + Tür seçimi
│   └─ Türler: FLASHCARD / QUIZ / READING
│
├─ İçerik Ekleme Yöntemleri
│   ├─ [Manuel Ekle] → form açılır, soru/cevap gir → [Kaydet]
│   ├─ [AI ile Üret] → konu gir → API /ai/generate → kartlar gelir
│   │   ├─ Checker AI: kalite doğrulama (3 turda en iyi)
│   │   └─ Sonuçlar önizleme → [Kabul Et] → modüle eklenir
│   ├─ [PDF Yükle] → /api/file/extract → metin → /ai/generate
│   └─ [Görselden Üret] → fotoğraf yükle → Vision AI → kartlar
│
├─ Görünürlük: PRIVATE / PUBLIC
│
└─ [Yayınla] → API POST /api/modules → kütüphaneye gider
```

---

### 📖 MODÜL DETAY (/dashboard/modules/[id])

```
Modül Detay (OWNER)
│
├─ Modül başlığı, açıklama, istatistikler
│   ├─ Kart sayısı
│   ├─ Kayıt sayısı
│   └─ Fork sayısı
│
├─ Kart Listesi
│   ├─ [Düzenle] → inline düzenleme → [Kaydet]
│   └─ [Sil] → kart silinir
│
├─ [+ Kart Ekle] → form → API POST /api/modules/[id]/items
├─ [Modülü Sil] → onay → API DELETE
├─ [Fork] → modülü kütüphaneye kopyala (SAVED)
└─ [Çalış] → Study Player
```

---

### 🎮 WEB ÇALIŞMA OTURUMU (/study)

```
Web Study Player
│
├─ Flashcard (3D flip — CSS transform)
│   ├─ Soru yüzü
│   └─ [Kartı Çevir] → Cevap
│       ├─ [Bilmiyorum]
│       ├─ [Zordu]
│       └─ [Kolay]
│
├─ Quiz modu (varsa)
│   ├─ 4 seçenek
│   └─ [Seç] → doğru/yanlış görsel geribildirim
│
└─ Tamamlanınca → özet + /dashboard
```

---

### 🧭 ÖĞRENME YOLCULUĞU (/dashboard/learning)

```
Öğrenme Yolculukları
│
├─ Yolculuk Listesi (kullanıcının oluşturduğu)
│   └─ [Yolculuğa Bas] → Journey Player
│
├─ [+ Yeni Yolculuk] → konu gir → derinlik seç
│   ├─ Derinlik: basic / standard / deep
│   └─ [Oluştur] → AI syllabus üretir → slaytlar hazırlanır
│
└─ Journey Player
    ├─ Syllabus (içindekiler)
    ├─ Slayt Okuyucu (HTML içerik)
    ├─ Peeking Soruları (her slayt sonunda)
    ├─ [Slaydı Yeniden Oluştur] → API /ai/learning-path/generate-slide
    ├─ [Konuyu Değiştir] → AI modify → API /ai/learning-path/modify
    └─ [Tamamla] → journey completed, puan kazanılır
```

---

### 🔍 KEŞFET (/dashboard/discover)

```
Keşfet
│
├─ Arama (debounce 300ms)
├─ Filtreler: Tür / Sıralama (en yeni / en çok kaydedilen)
│
├─ Modül Kartı
│   ├─ [Kaydet] → API /api/modules/[id]/save → kütüphaneye girer
│   ├─ [Çalış] → Study Player
│   └─ [Fork] → modülü kopyala ve düzenle
│
└─ Koleksiyon Kartı
    ├─ [Kaydet] → kütüphaneye
    └─ [İçini Gör] → koleksiyon detay
```

---

### 📝 NOTLAR (/dashboard/notes)

```
Notlar
│
├─ Not Listesi
│   ├─ [Nota Bas] → not detayı (HTML render, sanitized)
│   └─ [Sil]
│
├─ [+ AI Not Üret]
│   ├─ Metin gir veya PDF yükle
│   └─ API /ai/generate-note → not oluşur
│
└─ [+ Manuel Not] → başlık + içerik → kaydet
```

---

### 🏆 LIDERBOARD (/dashboard/leaderboard)

```
Liderboard
│
├─ Zaman filtresi: Bu Ay / Tüm Zamanlar
├─ Sıralama tablosu (finalScore'a göre)
│   ├─ Sıra, Kullanıcı adı, Tier rozeti, Puan
│   └─ [Kullanıcıya bas] → profil sayfası
│
├─ Kendi sıran (sayfada listelenmesen bile gösterilir)
└─ Tier açıklaması → seed→apex basamakları
```

---

### 📊 ANALİTİK (/dashboard/analytics)

```
Analitik
│
├─ Özet: Süre, Çözülen, Doğruluk, Streak
├─ Günlük Aktivite Grafiği (son 30 gün)
├─ Modül Bazlı Performans
│   ├─ Her modül için doğruluk
│   └─ [Modüle git]
└─ Zayıflık Raporu (varsa) → hangi kartlar/konular sorunlu
```

---

### ⚙️ AYARLAR (/dashboard/settings)

```
Ayarlar
│
├─ Profil
│   ├─ Avatar değiştir
│   ├─ Kullanıcı adı (handle) güncelle
│   └─ Dil tercihi (TR/EN)
│
├─ Hesap
│   ├─ E-posta değiştir
│   └─ Şifre değiştir
│
└─ Tehlike Bölgesi
    └─ [Hesabı Sil] → Onay → soft delete → login
```

---

### 📂 KOLEKSİYONLAR (/dashboard/collections)

```
Koleksiyonlar
│
├─ Koleksiyon Listesi
│   └─ [Koleksiyona bas] → içindeki modüller
│       ├─ [Modüle bas] → Study Player
│       └─ [Modülü Kaldır]
│
└─ [+ Yeni Koleksiyon]
    ├─ Başlık + Açıklama
    ├─ Görünürlük: PRIVATE / PUBLIC
    └─ [Oluştur] → API POST /api/collections
```

---

### 📸 FOTOĞRAFTAN ÇÖZÜM (/dashboard/ai/solve-photo)

```
AI Soru Çözücü (Web)
│
├─ [Fotoğraf Yükle] veya sürükle-bırak
├─ API POST /api/ai/solve-photo → Groq Vision
│   ├─ Rate limit: saatte 10
│   └─ Çözüm gelir → ekranda gösterilir
│
├─ [Nota Kaydet] → /dashboard/notes
└─ [Tekrar Çöz] → yeni fotoğraf yükle
```

---

## 🤖 AI KATMANI — HER YERDE ÇALIŞAN

```
AI Özellikleri
│
├─ İçerik Üretimi
│   ├─ Konu → Flashcard/Quiz kartları (Groq LLaMA)
│   │   └─ Checker AI: üretilen kartları kalite kontrol + yeniden yazar
│   ├─ Metin/PDF → AI Not (özetleme)
│   ├─ Fotoğraf → Soru Çözümü (Vision AI)
│   └─ Konu → Öğrenme Yolculuğu (syllabus + slaytlar)
│
└─ Rate Limitler (spam koruması)
    ├─ Soru çözme: saatte 10 (web) / dakikada 5 (mobile)
    ├─ Not üretimi: saatte 10
    ├─ Journey oluşturma: saatte 5
    └─ Modül üretimi: saatte 10
```

---

## 💎 PUANLAMA SİSTEMİ — ARKA PLANDA

```
Her çalışma oturumundan sonra otomatik güncellenir:
│
├─ Görünür Metrikler
│   ├─ Çalışma süresi (dakika)
│   ├─ İncelenen kart sayısı
│   ├─ Doğruluk oranı
│   ├─ Oluşturulan modül sayısı
│   ├─ Tamamlanan yolculuk
│   └─ Aktif gün sayısı
│
├─ Gizli Sinyal Skorları (kullanıcı göremez)
│   ├─ SM-2 uyum skoru (zamanında tekrar yapıyor mu?)
│   ├─ Oturum yayılım skoru (gün içi dağılım)
│   ├─ Doğruluk trend skoru
│   ├─ Derin inceleme skoru (zor kartlarda başarı)
│   ├─ İçerik adoption (kaç kişi modülünü çalıştı)
│   └─ İçerik kalitesi (onların doğruluk ortalaması)
│
├─ Anti-Gaming
│   ├─ Hız penaltısı (çok hızlı yanıt)
│   └─ Desen penaltısı (robotik davranış)
│
└─ Tier Sistemi
    seed → sprout → sapling → oak → peak → apex
```

---

## 🔄 ARKA PLAN İŞLEMLERİ

```
Otomatik Çalışanlar
│
├─ Her gece 02:00 UTC — Skor yeniden hesaplama cron'u
│   └─ Dünkü aktif kullanıcılar → 50'şer batch → finalScore güncellenir
│
├─ SM-2 Token Rotasyonu
│   └─ Her API isteğinde refresh token'ı rotate eder (90 günlük geçerlilik)
│
└─ Yolculuk Slide Üretimi (async)
    └─ Journey start → slaytlar arka planda üretilir → kullanıcı okudukça hazır
```

---

## 📌 GELİŞTİRMEDE KULLANILACAK REFERANS

### Mobil Navigasyon Özeti
| Tab | Dosya | Açılır Ekranlar |
|-----|-------|-----------------|
| Home | `(tabs)/index.tsx` | `/study/daily`, `/study/[id]` |
| Library | `(tabs)/library.tsx` | `/study/[id]`, `/notes/[id]`, `/notes/new`, `/collections/[id]`, `/collections/new` |
| Explore | `(tabs)/explore.tsx` | `/study/[id]`, `/collections/[id]` |
| Create | `create.tsx` | `/notes/[id]`, `/journey/[id]` |
| Profile | `(tabs)/profile.tsx` | `/analytics`, login (logout/delete) |

### Web Navigasyon Özeti
| Sayfa | Route | Ana Aksiyonlar |
|-------|-------|----------------|
| Dashboard | `/dashboard` | → library, learning, study/daily |
| Kütüphane | `/dashboard/library` | CRUD modül, çalış, kaydet, fork |
| Oluştur | `/dashboard/create` | AI üretim, PDF, manuel |
| Learning | `/dashboard/learning` | Journey oluştur/oynat |
| Keşfet | `/dashboard/discover` | kaydet, fork, çalış |
| Notlar | `/dashboard/notes` | AI not, manuel not |
| Liderboard | `/dashboard/leaderboard` | sıralama, profil görüntüle |
| Analitik | `/dashboard/analytics` | grafik, modül performans |
| Ayarlar | `/dashboard/settings` | profil edit, hesap sil |

