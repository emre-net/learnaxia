# 🗺️ LearnAxia — Live Platform & Feature State Matrix

Last Updated: 2026-10-22

This live document tracks feature parity and implementation status across the **Web Platform (`apps/web`)** and the **Mobile Application (`apps/mobile`)**.

---

## 📊 Dual-Platform Feature Status

| Feature Module | Shared Contract (`packages/shared`) | Platform Backend (`apps/web/api`) | Web Frontend (`apps/web`) | Mobile App (`apps/mobile`) | Parity Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Auth: Register / Login** | ✅ `auth.schema.ts` (Name + Handle + Min 6 pass) | ✅ `/api/mobile/register` & login | ✅ Auth Modal / Pages | ✅ Login Screen + Handle support | 🟢 **In Sync** |
| **Question Types (4 Types)**| ✅ `FLASHCARD`, `MC`, `TRUE_FALSE`, `GAP` | ✅ Module CRUD endpoints | ✅ Multi-type study view | ✅ 4 Card Renderers (`MCCard`, `TF`, `Gap`, `Flashcard`) | 🟢 **In Sync** |
| **Study Module Creator** | ✅ `module.types.ts` | ✅ Create & Edit API | ✅ Full Creator UI | ✅ 4 Soru Tipli Mobil Oluşturucu | 🟢 **In Sync** |
| **Notes & Rich Content** | ✅ Note domain types | ✅ Note CRUD | ✅ Web Editor (TipTap) | ✅ Native Not Editörü (`notes/[id].tsx`) | 🟢 **In Sync** |
| **Drawing & Canvas** | ✅ `drawing.types.ts` | ✅ Note Storage | 🟡 Canvas Draft | ✅ Vektör Çizim Tuvali (`DrawingCanvas`) | 🟢 **In Sync** |
| **Categories & Explore** | ✅ `categories.ts` | ✅ Categories API | ✅ Explore Page | ✅ Kategori Filtreli Keşfet (`explore.tsx`) | 🟢 **In Sync** |
| **Offline Synchronization** | ✅ Shared Domain | ✅ Study Log Endpoints | N/A (Web is online) | ✅ Cache & Sync Queue (`OfflineStorageService`) | 🟢 **In Sync** |

---

## 🎯 Legend
- 🟢 **In Sync:** Both Platform and Mobile are fully aligned with the shared contract.
- 🟡 **Web Ahead:** Feature is active on Web Platform; Mobile implementation is in progress.
- ⚪ **In Planning:** Architecture designed, waiting for sprint implementation.

---

## 🚀 Active Roadmap Priorities
1. **Study Statistics & Analytics Parity:** Synchronize user streak and study stats across web and mobile.
2. **Collections & Learning Journey Parity:** Multi-module playlists and learning journeys.
