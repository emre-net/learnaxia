# 🧭 Learnaxia Platform Yetenek, Özellik ve Durum Raporu
**Tarih:** 13 Ekim 2026 | **Sürüm:** Production v1.0.0 (Web Canlı: https://learnaxia.com / Android v1.0.0)

Bu rapor; platforma yeni eklenecek özelliklerin mevcut mimariyle çakışmaması, hangi sistemlerin hazır çalıştığı ve hangilerinin geliştirilmeye açık olduğunu hızlıca analiz edebilmeniz için hazırlanmıştır.

---

## 📌 1. Hızlı Mimari Özeti

* **Web:** Next.js 15.5.15 (Standalone container, Tailwind CSS 4, React 19, NextAuth v5 beta).
* **Mobil:** Expo SDK 52 / React Native 0.76 (Hermes motoru, JWT + Refresh token rotasyonu, NativeWind).
* **Veritabanı & API:** PostgreSQL (Railway), Prisma ORM 5.22, monorepo mimarisi (`@learnaxia/shared`).
* **AI Katmanı:** OpenAI (GPT-4o / GPT-4o-mini) & Groq entegrasyonu, JSON Schema doğrulama, Görsel soru çözme (Vision).

---

## 📊 2. Modül Bazlı Özellik ve Durum Matrisi

### 🏷️ Durum Göstergeleri
* 🟢 **Tam Aktif:** Kodlanmış, test edilmiş ve canlıda çalışan özellik.
* 🟡 **Kısmi / İyileştirmeye Açık:** Çalışıyor ancak UX veya özellik derinliği geliştirilebilir.
* ⚪ **Altyapı Var / Arayüz Bekliyor:** Veritabanı modeli veya API ucu hazır, tam arayüz entegrasyonu bekliyor.

---

### A. 🔐 Kimlik, Güvenlik & Profil Yönetimi

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Google & E-posta Girişi (Web)** | Web | 🟢 Tam Aktif | NextAuth v5 ile güvenli session çerezi, şifreli bcrypt girişi ve Google OAuth. |
| **Mobil JWT & Refresh Token** | Mobil | 🟢 Tam Aktif | Access Token (kısa ömürlü) + Refresh Token Rotasyonu (`MobileRefreshToken` tablosu). |
| **Şifre Sıfırlama & Doğrulama** | Web / Mobil | 🟢 Tam Aktif | Resend e-posta servisi ile token bazlı güvenli şifre sıfırlama akışı (`/auth/reset-password`). |
| **Kullanıcı Profili & Handle** | Web / Mobil | 🟢 Tam Aktif | `@handle`, biyografi, avatar, tercih edilen dil (`tr`/`en`) ve hesap ayarları. |
| **Onboarding & Misafir Geçişi** | Web | 🟢 Tam Aktif | Misafir verilerinin üye olunca hesaba aktarılması (`merge-guest-data`). |

---

### B. 🧠 Çalışma & Akıllı Öğrenme (Study Engine)

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Aralıklı Tekrar (SM-2 Spaced Repetition)** | Web / Mobil | 🟢 Tam Aktif | Klasik SuperMemo-2 algoritması. Kart zorluğuna göre bir sonraki tekrar gününü hesaplar (`sm2Progress`). |
| **Günlük Çalışma Kuyruğu (Daily Queue)** | Web / Mobil | 🟢 Tam Aktif | O gün tekrar edilmesi gereken kartları otomatik filtreleyip sıraya dizer (`/study/daily`). |
| **Çoklu Soru Tipleri** | Web / Mobil | 🟢 Tam Aktif | 4 soru tipi desteklenir: **Flashcard** (Çift yüzlü), **Çoktan Seçmeli** (MC), **Boşluk Doldurma** (GAP), **Doğru/Yanlış** (TF). |
| **Çalışma Oturumu Kaydı & İstatistik** | Web / Mobil | 🟢 Tam Aktif | Çalışılan süre, doğruluk yüzdesi ve kart sayısı `StudySessionLog` tablosuna kaydedilir. |
| **Öğrenme Yolculuğu (Learning Journey)** | Web / Mobil | 🟡 Kısmi | Adım adım rehberli yolculuk akışı. API ve slayt üretimi aktif; mobil arayüzü sadeleştirilmiş durumda. |

---

### C. 🤖 Yapay Zeka (AI) Yetenekleri

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Yapay Zeka ile Modül/Kart Üretimi** | Web | 🟢 Tam Aktif | Konu başlığından 4 farklı soru tipinde otomatik kart seti üretir (`AIService.generateContent`). |
| **AI ile Ders Notu Üretimi** | Web / Mobil | 🟢 Tam Aktif | Verilen konudan yapılandırılmış Markdown/zengin metin ders notu ve özet çıkarır. |
| **Fotoğraftan Soru Çözme (Vision AI)** | Web / Mobil | 🟢 Tam Aktif | Kamera veya galeriden yüklenen soru fotoğrafını OCR + Vision AI ile çözüp adım adım anlatır. |
| **Yapay Zeka Öğrenme Rotası (Path)** | Web | 🟡 Kısmi | Konuya özel çok adımlı interaktif slaytlar ve rehber üretir (`/api/ai/learning-path`). |
| **AI Rate Limiting & Güvenlik** | Web / API | 🟢 Tam Aktif | Saatlik limit (`ApiRateLimit`) ve anlamsız konu tespiti (`validateTopic`) koruması. |

---

### D. 📚 Not, Modül & Kütüphane Yönetimi

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Manuel Kart/Modül Oluşturucu** | Web / Mobil | 🟢 Tam Aktif | Kullanıcının kendi kartlarını tek tek eklediği görsel editör (`/dashboard/create/manual`). |
| **Zengin Metin Not Editörü** | Web | 🟢 Tam Aktif | Tiptap ve BlockNote tabanlı gelişmiş not editörü; kod blokları, başlıklar ve biçimlendirme. |
| **Mobil Not Görüntüleme & Düzenleme** | Mobil | 🟢 Tam Aktif | Telefonda hızlı not alma ve görüntüleme (`/notes/[id]`). |
| **Koleksiyonlar (Klasörleme)** | Web / Mobil | 🟢 Tam Aktif | Modülleri ve notları tematik koleksiyonlar altında gruplama (`Collection` modeli). |
| **Dosyadan İçerik Çıkarma (Import)** | Web / API | 🟢 Tam Aktif | PDF ve Office belgelerinden metin çıkarıp kartlara dönüştürme altyapısı (`/api/file/extract`). |

---

### E. 🏆 Oyunlaştırma, Momentum & Analitik

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Momentum & Seviye Sistemi** | Web / Mobil | 🟢 Tam Aktif | Puan bazlı seviye atlama (Bronz, Gümüş, Altın, vb.), seviye barı ve günlük çalışma serisi (Streak). |
| **Liderlik Tablosu (Leaderboard)** | Web | 🟢 Tam Aktif | Kullanıcıların puan sıralaması ve haftalık/aylık rekabet tablosu (`/dashboard/leaderboard`). |
| **Çalışma Analitiği & Grafikler** | Web / Mobil | 🟢 Tam Aktif | Haftalık çalışma süresi grafikleri, doğruluk oranları ve odaklanma widget'ı (`focus-widget.tsx`). |
| **Rozet & Başarı Sistemi (Badges)** | Backend | 🟡 Kısmi | Sinyal ve rozet hesaplama motoru hazır (`lib/scoring/badges.ts`), profilde gösterim sade. |

---

### F. 🌐 Keşfet, Topluluk & Paylaşım

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Keşfet (Discover / Topluluk)** | Web / Mobil | 🟢 Tam Aktif | Herkese açık modülleri arama, kategorilere göre filtreleme ve popüler içerikleri görme. |
| **Modül Klonlama (Fork/Adopt)** | Web / API | 🟢 Tam Aktif | Başka bir kullanıcının paylaştığı kart setini kendi kütüphanesine kopyalayıp özelleştirme. |
| **Görünürlük Kontrolü (Public/Private)** | Web / Mobil | 🟢 Tam Aktif | Modül ve koleksiyonların gizli veya genele açık yapılabilmesi. |

---

### G. 🛡️ Sistem, Güvenlik & Admin Paneli

| Özellik | Platform | Durum | Ne Yapar & Nasıl Çalışır? |
| :--- | :---: | :---: | :--- |
| **Admin Yönetim Paneli** | Web | 🟢 Tam Aktif | Modülleri, kullanıcıları ve genel platform istatistiklerini izleme (`/admin`). |
| **Sistem & AI Logları** | Web | 🟢 Tam Aktif | API çağrıları, AI harcama/hata logları (`/admin/system/ai-logs`). |
| **Veritabanı Sağlığı & Ping** | Web / API | 🟢 Tam Aktif | `/api/ping`, `/api/server-health` uçları. Canlı üretim testleri devrede. |

---

## ⚡ 3. Yeni Özellik Eklerken Çakışma Önleme Rehberi (Architecture Checklist)

Yeni bir özellik planlarken aşağıdaki kurallara dikkat edilmelidir:

1. **Veritabanı Modelleri:**
   * Kullanıcı ilerlemesi eklenecekse sıfırdan tablo açmak yerine mevcut `UserScore`, `StudySessionLog` veya `SM2Progress` modellerine bağlanmalıdır.
   * İçerik türü eklenecekse mevcut `Module` (kart destesi), `Note` (doküman) ve `Collection` (koleksiyon) hiyerarşisi korunmalıdır.
2. **API & Kimlik Doğrulama Çiftliği:**
   * Bir web endpoint'i açıldığında mobil tarafın da erişebilmesi için `/api/mobile/...` karşılığı veya hem `auth()` (session) hem de Bearer token kabul eden hibrit doğrulama kullanılmalıdır.
3. **AI İstekleri:**
   * Doğrudan OpenAI/Groq istemcisi çağırmak yerine mutlaka `AIService` ve `checkRateLimit` katmanından geçilmelidir (maliyet patlamasını ve spam'i önlemek için).
4. **Çevrimdışı (Offline) Durum:**
   * Mobil uygulamada henüz tam çevrimdışı SQLite senkronizasyonu yoktur; AsyncStorage önbellek amaçlı kullanılmaktadır. Offline-first bir özellik planlanıyorsa senkronizasyon çatışması hesaba katılmalıdır.
