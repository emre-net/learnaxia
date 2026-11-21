# LearnAxia — Design System, UX Architecture & Multi-Agent Alignment Spec
**Son Güncelleme:** 19 Kasım 2026  
**Durum:** Resmi Referans Dokümanı (Single Source of Design & Architecture Truth)

---

## 🎯 1. Yönetici Özeti ve Temel Felsefe (Design Philosophy)

LearnAxia, soğuk ve mekanik bir istatistik paneli veya şablon bir SaaS aracı değildir.  
Öğrenmeyi odaklı, akıcı ve motive edici kılan **insan merkezli, yaşayan bir sosyal öğrenme ve çalışma ekosistemidir**.

### ⚠️ "Yapay Zeka Tarafından Yapılmış" (AI-Generated Look) Kusurları ve Kesin Yasaklar:
1. **Zifiri Siyah (#000000) ve Kör Edici Beyaz (#FFFFFF) Yasağı:**  
   OLED ekranlarda ışık saçılmasına (halation), metinlerin titreşmesine ve göz yorgunluğuna sebep olur.  
   *Kural:* Arka planlar daima zengin derin kömür/çinko tonlarında (`#09090b` veya `#0c0d10`), kart yüzeyleri z-ekseni katmanına göre hafif aydınlatılmış (`#121215`, `#18181b`), metinler ise yumuşatılmış açık tonlarda (`#f4f4f5`, `#e4e4e7`, ikincil `#94a3b8`) olmalıdır.
2. **Kuru Metrik Yığıntısı (Telemetry Dump) Yasağı:**  
   Ana ekranın tepesine devasa "0 dk", "%100", "1 Çözüm" gibi kuru ve motivasyon kırıcı sayaçlar koymak kesinlikle yasaktır. Kullanıcı uygulamayı açtığında ilk olarak **Öğrenilecek İçerik**, **Kaldığı Yerden Devam Kartı** veya **Akıllı Keşif Balonları** ile karşılaşmalıdır.
3. **Zoraki Seri (Streak) Baskısı Yasağı:**  
   Günlük seri rozetleri ana ekranın en tepesinde devasa şekilde dayatılmamalı; kullanıcının momentumunu ve lig derecesini yansıtan zarif, rahatsız etmeyen kartlar içine yedirilmelidir.
4. **Sıkıştırılmış Tab Yasağı (Cramped Flex-1 Tabs):**  
   Mobilde 4-5 sekmeyi tek satıra `flex: 1` ile sıkıştırıp metinlerin kesilmesine ("Koleksiyo... 0") yol açmak amatörce bir yapay zeka hatasıdır. Sekmeler akıcı yatay kaydırılabilir (scrollable pill track) veya animasyonlu modern segmented control olarak tasarlanmalıdır.
5. **Gereksiz Büyük Harf Mikro Etiketler (Tracked-out Uppercase Labels):**  
   Her kutunun tepesine `TOPLAM ÇALIŞMA`, `DOĞRULUK`, `SETLER` gibi bağıran etiketler koymak arayüzü kalitesiz gösterir. Doğal, hiyerarşik tipografi kullanılmalıdır.

---

## 🏛️ 2. Platform Bütünlüğü & Web-Mobil Eşitliği (Dual-Platform Parity)

| Özellik | Web Platformu | Mobil Uygulama | Eşitlik Durumu & Çözüm |
| :--- | :--- | :--- | :--- |
| **Kütüphane Varlıkları** | Modüller, Koleksiyonlar, Notlar, Rotalar, **AI Çözümleri** | Modüller, Koleksiyonlar, Notlar, Rotalar | ❌ **Hata:** Mobilde AI Çözümleri eksikti. 5 sekmeli tam yapıya geçirilmeli. |
| **Tasarım Dili** | Slate/Zinc derin degradeler, cam efekti, parlak vurgular | Zifiri siyah, sert gri kutular, sabit inline renkler | ❌ **Hata:** Tasarım dilleri kopuktu. Ortak token sistemine bağlanmalı. |
| **Onboarding / Keşif** | `OnboardingModal` mevcut | Yok (sıfır modüllü kullanıcı boş ekran görüyor) | ❌ **Hata:** Mobilde hikaye balonları/keşif kartları eklenmeli. |
| **Momentum Seviyeleri** | `apps/web/lib/scoring/tiers.ts` | Backend'den veri çekiyor, tanım yok | ⚠️ **Eksik:** `tiers.ts` `@learnaxia/shared` paketine taşınmalı. |
| **Soru Tipleri (4 Tip)** | Flashcard, MC, True/False, Gap Fill | Flashcard, MC, True/False, Gap Fill | ✅ Tam eşitlik mevcut (Homogeneous Module kuralı korunuyor). |

---

## 📱 3. Yenilenen Dashboard (Ana Sayfa) Mimarisi

Dashboard bir kondisyon saati değil, **kişiselleştirilmiş bir öğrenme akışıdır (Personalized Learning Feed)**:

```
+-----------------------------------------------------------+
|  [EM]  İyi çalışmalar, Emre! ✨           [🔔] [⚙️]       |
|        Bugün toplulukta 48 soru çözüldü                   |
+-----------------------------------------------------------+
|  🔥 KEŞİF BALONLARI (Story Bubbles - Yeni/Aktif Kullanıcı) |
|  (📸 Soru Çöz)  (⚡ AI Rotası)  (📚 Popüler)  (📝 Hızlı Not)|
+-----------------------------------------------------------+
|  🎯 HERO: KALDIĞIN YERDEN DEVAM ET                         |
|  +-----------------------------------------------------+  |
|  | [BOŞLUK DOLDURMA]                        1/1 Öğe   |  |
|  | adaamm                                             |  |
|  | [========================] %100                   |  |
|  | [ ▶️ Çalışmaya Devam Et ]                         |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
|  ⚡ MOMENTUM & LİG DURUMU (Minimalist Şerit)              |
|  🥉 Bronz Ligi  •  2 PTS  •  1. Sıradasın  •  Sıralama →   |
+-----------------------------------------------------------+
|  🧠 GÜNLÜK TEKRAR & ODAK (Akıllı Kartlar)                  |
|  - SM2 Günlük Tekrarı (Bugün tekrar edilecek 3 kart)      |
|  - Pomodoro Odak Sayacı (Hızlı Başlat)                    |
+-----------------------------------------------------------+
```

---

## 📚 4. Yenilenen Kütüphane (Library) Mimarisi & Eksik AI Çözümleri

### 5 Temel Varlık (Exhaustive Library Entities):
1. **Modüller:** Flashcard, Çoktan Seçmeli, Doğru/Yanlış veya Boşluk Doldurma içeren çalışma setleri.
2. **Koleksiyonlar:** İlgili modülleri bir araya toplayan ders/konu klasörleri.
3. **Notlar:** Rich-text ve serbest el çizim/mindmap içeren çalışma notları.
4. **Rotalar (Learning Journeys):** AI tarafından konudan rotaya üretilen slaytlı yolculuklar.
5. **AI Çözümleri (Solved Questions):** Kameradan veya galeriden yüklenip yapay zekaya çözdürülen soruların arşivi. (Fotoğraf görseli, soru metni, adım adım çözüm ve çıkarılan notlar).

### Tab Switcher Tasarımı:
* Ekran genişliğine göre sıkışan `flex: 1` butonları yerine; **yatayda yumuşak kayan, aktif sekmenin altında pürüzsüz animasyonlu pill göstergesi olan `ScrollableSegmentedBar`** kullanılır.
* Metinler asla üç nokta ile kesilmez ("Koleksiyo..." hatası son bulur).
* Her sekme yanında şık `(sayı)` rozeti yer alır.

---

## 🏆 5. Momentum & Seviye (Tier) Sistemi Rehberi

Kullanıcıların kafasındaki soru işaretlerini giderecek tekil puanlama cetveli:

### Seviyeler (Tiers):
* 🥉 **Bronz (0 – 499 pts):** Yeni başlayan kaşifler. Renk: `#CD7F32`
* 🥈 **Gümüş (500 – 1.999 pts):** Düzenli çalışan öğrenciler. Renk: `#C0C0C0`
* 🥇 **Altın (2.000 – 7.499 pts):** Disiplinli ve istikrarlı ustalar. Renk: `#FFD700`
* 💠 **Platin (7.500 – 19.999 pts):** İleri düzey bilgi liderleri. Renk: `#00CED1`
* 💎 **Elmas (20.000+ pts):** Zirvedeki efsaneler. Renk: `#B9F2FF`

### Puan Kazanma Kuralları:
* Doğru cevaplanan her soru: **+10 PTS**
* Tamamlanan her modül: **+50 PTS**
* Günlük SM2 tekrarı tamamlama: **+25 PTS**
* AI ile soru çözdürme / not çıkarma: **+15 PTS**
* Aktif gün katılımı: **+5 PTS / gün**

---

## 🧹 6. Gereksiz / Atıl Kodlar ve Temizlik Envanteri (Orphan Code Audit)

Aşağıdaki dosyalar geçmişteki şablonlardan veya farklı ajanların denemelerinden kalmış olup projede hiçbir yere bağlanmamaktadır:
1. `apps/mobile/components/hello-wave.tsx` (Expo starter kalıntısı - Atıl)
2. `apps/mobile/components/parallax-scroll-view.tsx` (Expo starter kalıntısı - Atıl)
3. `apps/mobile/components/external-link.tsx` (Expo starter kalıntısı - Atıl)
4. `apps/mobile/components/ui/collapsible.tsx` (Expo starter kalıntısı - Atıl)
5. `apps/mobile/app/(tabs)/create_placeholder.tsx` (Eski placeholder - Atıl)
6. `apps/mobile/create_transparent.js` (Eski build script kalıntısı - Atıl)
7. `apps/web/lib/i18n/dictionaries.ts` (`@learnaxia/shared` ile mükerrer - Tekilleştirilmeli)
8. `apps/mobile/assets/images/react-logo*.png` (Kullanılmayan expo logoları - Atıl)

---

## 🛡️ 7. Gelecek Ajanlar İçin Kesin Kurallar (Instructions for Future Agents)

1. **Hiçbir yeni özelliği web'de yapıp mobilde unutup bırakmayın.**
2. **Kütüphaneye her dokunulduğunda 5 varlığın (Modül, Koleksiyon, Not, Rota, AI Çözümü) eksiksiz olduğunu kontrol edin.**
3. **Ekran tasarlarken doğrudan `#000000` / `#FFFFFF` yazmayın, daima derin çinko (`#09090b` / `#121215` / `#f4f4f5`) ve semantic token kullanın.**
4. **Kullanıcı deneyimini kuru sayaçlarla doldurmayın; öğrencinin önüne önce içeriği, devam kartını ve etkileşimi koyun.**
5. **Kod yazmaya başlamadan önce bu dokümanı ve `AGENTS.md` dosyasını mutlaka okuyun.**
