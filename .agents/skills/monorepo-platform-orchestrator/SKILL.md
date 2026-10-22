---
name: monorepo-platform-orchestrator
description: Master orchestrator for managing large-scale dual-platform monorepos (Next.js Web Platform + Expo React Native Mobile + Shared Core). Enforces contract-first synchronization, dual-platform parity, task decomposition, and turbo build integrity.
triggers: [manage-project, monorepo-task, platform-sync, multi-platform-feature, architecture-governance]
outputs: [platform-matrix, synchronized-tasks, dual-platform-plan]
---

# Monorepo Platform Orchestrator (LearnAxia Master Governance)

This master skill governs the end-to-end development and synchronization of the LearnAxia monorepo, ensuring the Web Platform (`apps/web`) and Mobile App (`apps/mobile`) never drift out of sync while scaling.

## The 3 Pillars of LearnAxia Architecture

```
                    ┌───────────────────────────────┐
                    │       packages/shared         │
                    │ (Types, Zod Schemas, i18n)    │
                    └───────────────┬───────────────┘
                                    │ Single Source of Truth
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        ┌───────────────────┐               ┌───────────────────┐
        │     apps/web      │               │    apps/mobile    │
        │ Next.js 15 + SSR  │ ◄─ REST API ─►│   Expo SDK 52     │
        │ Prisma + Postgres │               │  Offline Storage  │
        └───────────────────┘               └───────────────────┘
```

---

## 1. The Contract-First Law (Zero-Drift Execution)

Every feature touching data or business logic MUST follow this exact 4-phase sequence:

1. **Step 1: Core Contract (`packages/shared`)**
   - Define TypeScript interfaces in `domain-types/`.
   - Define Zod validation schemas in `validation/`.
   - Define multi-language strings in `i18n/dictionaries.ts`.
2. **Step 2: Platform Backend (`apps/web/app/api`)**
   - Update Prisma schema and migrations if needed.
   - Implement route handlers, validating inputs strictly against the shared Zod schema.
   - Return responses typed with shared domain types.
3. **Step 3: Platform Web Frontend (`apps/web`)**
   - Implement or update Web UI components and forms.
4. **Step 4: Mobile App Frontend (`apps/mobile`)**
   - Implement or update native mobile screens, cards, and state.
   - Ensure offline cache / AsyncStorage persistence handles the updated structure.
   - Verify touch feedback and animations (`react-native-reanimated`).

---

## 2. Dual-Platform Feature Parity Matrix

The orchestrator maintains parity across all core feature domains:

| Domain | Platform (Web) | Application (Mobile) | Governance Rule |
| :--- | :--- | :--- | :--- |
| **Auth & Profile** | NextAuth / Credentials | JWT AuthContext + SecureStore | Parity: Name (UTF-8) vs Handle (`@username`) must match on both. Password min 6. |
| **Study Modules** | Module Creator & Study | Native Study Screen + Renderers | Parity: All 4 question types (`FLASHCARD`, `MC`, `TRUE_FALSE`, `GAP`) must render identically on both. |
| **Notes & Drawing** | TipTap / Canvas Web | Native Gesture + Skia/SVG | Parity: Never use webviews inside mobile for native note reading/writing. Support offline-first. |
| **Categories & Search**| Global category tree | Explore Screen category filters | Parity: Exact same category constants from `@learnaxia/shared`. |
| **Subscriptions & Pay**| Stripe web checkout | In-App Purchase / Web view checkout | Parity: Web subscription status unlocks premium features on Mobile instantly. |

---

## 3. Atomic Task Decomposition

When given a major feature request, the orchestrator divides it into atomic, non-destructive steps:
- **`[SHARED]`**: Contract and type updates.
- **`[API]`**: Server endpoint and database logic.
- **`[WEB]`**: Platform dashboard and web interaction.
- **`[MOBILE]`**: Mobile native screen, gesture, and offline support.
- **`[VERIFY]`**: Turbo monorepo validation (`npm run lint`, TypeScript checks).

---

## 4. Disaster Prevention & Guardrails

- **Never leave one platform half-done:** If a database model or API payload changes, both consumers (Web & Mobile) must be updated in the same session.
- **Preserve React Version Isolation:** Root uses React 19 / Next.js 15, while `apps/mobile` overrides to React 18.3.1 (Expo SDK 52 requirement). Never force React 19 into `apps/mobile` until Expo officially supports it.
- **Never delete or stub question types:** Simplification must never compromise multi-type quiz rendering.
