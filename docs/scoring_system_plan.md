# Learnaxia — Puan & Tier Sistemi: Nihai Plan

## Alınan Kararlar

| Karar | Seçim |
|-------|-------|
| Liderboard periyotları | Haftalık + Aylık + 3 Aylık + Tüm Zamanlar |
| Geçmiş veri | Hesaba katılır (retrospektif) |
| Skor görünürlüğü | Görünür metrikler paylaşılır, ağırlıklar gizli |
| Profil gizliliği | Kullanıcı kapatabilir → sadece skor + rozetler görünür |
| Tier isimleri | Bronz / Gümüş / Altın / Platin / Elmas |
| Ödüller | Her ayın en üstlerine — ayrı faz |
| Özel rozetler | Başarıya göre (tier'dan bağımsız) |

---

## ① Puan Adı Önerisi

"Puan" kelimesi yerine platforma özel bir kavram öneriyorum:

> **"Etki" (EKI)** — Öğrenme + Üretim + Topluluk katkısını birleştiren tek sayı.

Kullanıcıya şöyle yansır: *"1.247 Etki"* veya kısa: *"1.2K EKI"*

> [!IMPORTANT]
> Bu isim onaylanmadan kodlamaya geçmiyorum.
> Alternatifler: "Güç", "Katkı", "Momentum", "XP" (evrensel, herkes bilir)

---

## ② Tier Sistemi

### Eşikler (Tüm Zamanlar Kümülatif Etki Puanına Göre)

| Tier | Simge | Etki Aralığı | Renk |
|------|-------|-------------|------|
| Bronz | 🥉 | 0 – 499 | `#CD7F32` |
| Gümüş | 🥈 | 500 – 1.999 | `#C0C0C0` |
| Altın | 🥇 | 2.000 – 7.499 | `#FFD700` |
| Platin | 💠 | 7.500 – 19.999 | `#00CED1` |
| Elmas | 💎 | 20.000+ | `#B9F2FF` gradient |

### Tier Hesaplama Mantığı

- **Tüm zamanlar puanı** → kalıcı tier belirler, hiç düşmez
- **3 Aylık pencere** → "aktif tier" belirler, liderboard'da bu görünür
- Kullanıcının profili her ikisini de gösterir:
  `Altın (Genel) · Gümüş (Son 3 Ay Aktif)`

---

## ③ Sinyal Metrikleri — Detaylı Hesaplama

### GRUP A — Öğrenme Aktivitesi

---

#### `study_minutes` — Günlük Çalışma Süresi
```
Kaynak:   StudySessionLog.durationSec
Kural:    Günde 90 dakikaya kadar tam değer
          90–150dk arası: her dakika 0.5 puan (diminishing)
          150dk üzeri:    ek puan yok (loglama devam eder)
Neden:    Cramming'i caydırır, sürdürülebilir çalışmayı ödüllendirir
Günlük MAX puan: 90 × 0.8 = 72 Etki
```

---

#### `cards_reviewed` — İncelenen Kart Sayısı
```
Kaynak:   StudySessionLog.cardsAttempted
Kural:    İlk 50 kart/gün → tam değer (× 0.5 Etki/kart)
          51–100 kart/gün → yarı değer (× 0.25)
          100+ kart/gün   → çeyrek değer (× 0.125)
Neden:    Toplu kart geçme (buton spam) caydırılır
Günlük MAX puan: ~37.5 Etki
```

---

#### `sm2_adherence` — SM-2'ye Uyum (GİZLİ AĞIRLIK)
```
Kaynak:   SM2Progress.nextReviewAt ↔ StudySessionLog.startedAt
Hesap:    sm2OnTimeCards / max(sm2DueCards, 1)
          "On-time" = nextReviewAt ± 1 gün içinde yapılan
          Erken yapılan: 0.3× değer
          Zamanında:     1.0× değer
          Gecikmiş (>3 gün): 0.5× değer
Ağırlık:  × 2.0 (en yüksek öğrenme sinyali)
Neden:    Gerçek spaced repetition disiplini — zaman kilitli, fake yapılamaz
```

---

#### `session_spread` — Oturum Yayılımı (GİZLİ AĞIRLIK)
```
Kaynak:   StudySessionLog.startedAt timestamp dağılımı
Ideal:    Aynı günde 2–3 farklı oturum, aralarında en az 2 saat
Hesap:    Gün içi oturum başlangıçları arasındaki median fark
          < 30 dk fark → tek oturum sayılır (birleştirilir)
          ≥ 2 farklı blok → spread bonus × 1.2
Penaltı:  Günlük tek 120dk+ oturum → session_spread_score = 0
```

---

#### `accuracy_trend` — Doğruluk Trendi (GİZLİ AĞIRLIK)
```
Kaynak:   ItemSession.result (son 14 gün)
Hesap:    (son 7 günün ortalaması) - (önceki 7 günün ortalaması)
          delta > +5%  → trend bonus × 1.5
          -5% < delta < +5% → nötr × 1.0
          delta < -5%  → trend malus × 0.7
Neden:    Gelişim ödüllenir, regresyon hafifçe cezalandırılır
```

---

#### `review_depth` — Zor Kart Performansı (GİZLİ AĞIRLIK)
```
Kaynak:   ItemProgress.strengthScore < 0.4 olan kartlar
Hesap:    Bu "zayıf" kartlarda doğru cevap oranı
          Zor kartı doğru cevaplamak = kolay kart × 2.0 puan
Neden:    Kolay kartları hızlı geçip puan farmingini engeller
          Gerçek öğrenmeyi tespit eder
```

---

### GRUP B — Üretim & İçerik

---

#### `modules_created` — Oluşturulan Modüller
```
Kaynak:   Module.creatorId = userId, visibility = PUBLIC veya PRIVATE
Kural:    PUBLIC modül: 5 Etki
          PRIVATE modül: 1 Etki (kendi kullanımı da değerli)
          Silinen modül: puanı geri alınır
Not:      Oluşturma değil kalıcılık ödüllenir
```

---

#### `journeys_created` — Oluşturulan Journeyler
```
Kaynak:   LearningJourney.userId = userId, status = ACTIVE veya COMPLETED
Kural:    Her aktif journey: 3 Etki
          DRAFT olanlar sayılmaz
```

---

#### `content_saves` — İçeriğin Kaydedilme Sayısı
```
Kaynak:   UserModuleLibrary WHERE moduleId IN (user's modules) AND userId != ownerId
Kural:    Her benzersiz kullanıcı kaydı: 4 Etki
          Aynı kullanıcı birden fazla modül kaydederse:
            İlk modül: 4 Etki
            2. modül: 2 Etki
            3.+ modül: 0 Etki (farming koruması)
Neden:    "Takipçi toplayarak" puan yapılamaz
```

---

#### `content_studies` — İçeriğin Aktif Çalışılma Sayısı
```
Kaynak:   StudySessionLog WHERE moduleId IN (user's modules) AND userId != ownerId
Kural:    Her benzersiz (userId, moduleId) çifti için aylık 1 kez sayılır
          En az 5 kart çalışılmış olmalı (ghost session filtresi)
Değer:    Her sayılan aktif çalışma: 6 Etki
Neden:    Save'den farklı: gerçekten çalışıyorlar mı?
```

---

#### `content_adoption` — Benzersiz Kullanıcı (ContentAdoptionLog)
```
Kaynak:   ContentAdoptionLog.counted = true AND ownerId = userId
Kural:    counted = false durumları:
          - Aynı kullanıcı 3+ farklı modülünü çalışmış (farming)
          - cardsStudied < 5
          - student = owner (kendi içeriği)
Değer:    Her counted adoption: 8 Etki (en yüksek ağırlık)
```

---

#### `content_quality` — İçerik Kalitesi (GİZLİ ÇARPAN)
```
Kaynak:   ContentAdoptionLog.studentAccuracy ortalaması
Hesap:    Senin modülünü çalışanların ortalama doğruluğu
          > 0.75 → quality_multiplier × 1.2 (iyi öğretiyorsun)
          0.50–0.75 → × 1.0
          < 0.50 → × 0.8 (kötü hazırlanmış içerik sinyali)
Neden:    İçerik kalitesini dolaylı ölçer
```

---

#### `journey_completions` — Tamamlanan Journeyler (öğrenci olarak)
```
Kaynak:   Journey progress (son slide'a kadar gidilmesi)
Kural:    Her tamamlanan journey: 3 Etki
          Aynı journey tekrar: 0.5 Etki (pekiştirme)
```

---

### GRUP C — Anti-Gaming Sinyalleri (Tamamen Gizli)

---

#### `velocity_spike` — Ani Aktivite Artışı
```
Hesap:    Bu haftanın aktivitesi / son 4 haftanın ortalaması
          > 3.5× → antiGamingFactor -= 0.35
          > 2.0× → antiGamingFactor -= 0.15
          ≤ 2.0× → ceza yok
Neden:    "Liderboard'a girecekken patlama yapma" engeli
```

---

#### `pattern_entropy` — Davranış Entropi Kontrolü
```
Hesap:    Oturum başlangıç saatlerinin standart sapması (son 14 gün)
          StdDev < 10 dakika → muhtemelen bot/script → patternPenalty += 0.3
          StdDev < 30 dakika → şüpheli → patternPenalty += 0.1
Neden:    Gerçek insanlar mekanik değildir
```

---

## ④ Ana Formül

```
HammScore =
  study_minutes        × 0.80  +
  cards_reviewed       × 0.50  +
  sm2_adherence        × 2.00  +   ← gizli
  accuracy_trend       × 1.50  +   ← gizli
  session_spread       × 1.20  +   ← gizli
  review_depth         × 1.00  +   ← gizli
  journey_completions  × 3.00  +
  modules_created      × 5.00  +
  content_saves        × 4.00  +
  content_studies      × 6.00  +
  content_adoption     × 8.00  +   ← en yüksek
  content_quality      × 6.00      ← gizli çarpan

QualityMultiplier = accuracy_rate ^ 1.3
  → %60 doğruluk = 0.68×  |  %90 = 1.17×

ConsistencyCoef = log(activeDays + 1) / log(8)
  → 7 gün aktif ≈ 1.0  |  1 gün aktif ≈ 0.43

AntiGamingFactor = 1.0 - velocityPenalty - patternPenalty

FinalScore = HammScore × QualityMultiplier × ConsistencyCoef × AntiGamingFactor
```

---

## ⑤ Özel Rozetler (Tier'dan Bağımsız)

| Rozet | Simge | Koşul |
|-------|-------|-------|
| Eğitmen | 🏫 | 20+ benzersiz kullanıcı modülünü çalıştı |
| Viral İçerik | 🚀 | Bir modül 50+ kez kaydedildi |
| Üretici | ⚒️ | 5+ public modül oluşturuldu |
| Hassas | 🎯 | 30 günlük doğruluk ≥ %90 |
| Düzenli | 📅 | Bir ayda 20+ farklı gün aktif |
| SM-2 Ustası | 🧠 | Aylık 200+ SM-2 zamanında kart |
| Derin Öğrenen | 🌊 | Zor kartlarda %75+ başarı |
| Topluluk Yıldızı | ⭐ | İçerikleri toplam 100+ kez çalışıldı |

---

## ⑥ Liderboard Yapısı

```
4 Periyot:
├── Haftalık   → Her Pazartesi 00:00 UTC sıfırlanır
├── Aylık      → Her ayın 1'i sıfırlanır
├── 3 Aylık    → Kayan pencere (bugünden 90 gün geriye)
└── Tüm Zamanlar → Hiç sıfırlanmaz, kümülatif

Her periyot → Global + Tier bazlı filtreleme
```

---

## ⑦ Kullanıcıya Gösterilen Bilgiler

```
┌─────────────────────────────────────────────┐
│  💎 1.247 Etki              Platin           │
│                                             │
│  ⏱ 340 dk çalışma   📚 1.240 kart          │
│  ⚒ 3 modül üretildi  🎓 420 kişi çalıştı   │
│                                             │
│  Rozetler: 🏫 Eğitmen  🎯 Hassas            │
└─────────────────────────────────────────────┘
```

Ağırlıklar ve gizli sinyal skorları **asla gösterilmez**.

---

## ⑧ Uygulama Sırası

1. **Migration** → Yeni tablolar DB'ye
2. **Veri toplama** → Study endpoint'lerine log kaydı
3. **Scoring engine** → Pure TypeScript, test edilebilir
4. **Cron job** → Gece batch hesaplama
5. **API endpoints** → `/scores/me`, `/leaderboard`
6. **Frontend** → Web dashboard + profil + liderboard sayfası
7. **Mobil** → Profil tier rozeti

---

## ⑨ Tek Açık Soru

> [!IMPORTANT]
> **Puan adı onayı:** "Etki" mi yoksa başka bir isim mi?
> (Alternatifler: Momentum, XP, Güç, Kredi)
> Bu onaylanınca kodlamaya geçilir.
