# Learnaxia — Proje Dokümantasyonu

Bu klasör, platformun teknik ve operasyonel belgelerini içerir.

---

## 📋 Belgeler

### Güvenlik & Kalite
| Dosya | İçerik |
|-------|--------|
| [audit_final.md](./audit_final.md) | 4. Tur güvenlik taraması — 17 madde (Haziran 2026) |
| [audit_round3.md](./audit_round3.md) | 3. Tur güvenlik taraması |
| [audit_round2.md](./audit_round2.md) | 2. Tur güvenlik taraması |
| [final_audit_report.md](./final_audit_report.md) | İlk kapsamlı güvenlik raporu |
| [qa_test_scenarios.md](./qa_test_scenarios.md) | QA test senaryoları — happy path + edge case |

### Mimari & Geliştirme
| Dosya | İçerik |
|-------|--------|
| [flowcharts.md](./flowcharts.md) | 15 Mermaid akış şeması — her buton, ekran, API |
| [interaction_map.md](./interaction_map.md) | Detaylı etkileşim haritası |
| [mobile_roadmap.md](./mobile_roadmap.md) | Monorepo + Expo mobil roadmap (Faz 0–6) |
| [scoring_system_plan.md](./scoring_system_plan.md) | Puanlama sistemi tasarımı |
| [proje_analiz_raporu.md](./proje_analiz_raporu.md) | İlk proje analiz raporu |
| [ui_ux_analiz.md](./ui_ux_analiz.md) | UI/UX analizi |
| [market_readiness_report.md](./market_readiness_report.md) | Pazar hazırlık raporu |

### Deployment & Operations
| Dosya | İçerik |
|-------|--------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Railway deployment adımları |
| [launch_guide.md](./launch_guide.md) | Launch öncesi manuel adımlar (env, OAuth, App Store) |
| [launch_tasks.md](./launch_tasks.md) | Yapılacaklar kontrol listesi |

---

## 📁 Proje Yapısı

```
C:\lrx\
├── apps/
│   ├── web/          → Next.js web uygulaması (dashboard, API, auth)
│   └── mobile/       → Expo React Native mobil uygulama (iOS & Android)
├── packages/
│   └── shared/       → Ortak tipler, validasyon şemaları, i18n
├── scripts/
│   └── seed-learnaxia.js  → Test verisi seed scripti
└── docs/             → Bu klasör — tüm belgeler
```

---

## 🚀 Hızlı Başlangıç

```bash
# Web (dev)
cd apps/web && npm run dev

# Mobil (dev)
cd apps/mobile && npx expo start

# Prisma migration (Railway deploy sonrası bir kez)
npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma

# Test verisi ekle (sadece development)
node scripts/seed-learnaxia.js
```

---

## 📌 Önemli Notlar

- **`allowDangerousEmailAccountLinking: true`** → Bilinçli bırakıldı. Farklı OAuth sağlayıcılardan aynı e-posta ile giriş yapılsa bile tek hesaba bağlanır.
- Admin paneline erişim için kullanıcı rolünün `ADMIN` olması gerekir.
- Mobilde Google ile giriş henüz yok — sadece e-posta/şifre.
- Cron (gece 02:00 UTC) `x-cron-secret` header'ı ile korunuyor.
