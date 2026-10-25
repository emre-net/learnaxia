# LearnAxia — Agent Operating System & Project Governance (AGENTS.md)

Welcome to **LearnAxia**. This is a large-scale, dual-platform educational monorepo consisting of a Web Platform, a Mobile Application, and a Shared Core.

---

## 🏛️ Monorepo Architecture

- **`packages/shared`**: The Single Source of Truth. Contains TypeScript domain types, Zod validation schemas, constants, and i18n dictionaries.
- **`apps/web`**: Platform side. Built with Next.js 15, React 19, Prisma ORM (PostgreSQL / Supabase), and Tailwind CSS. Provides web dashboard, study modes, and `/api` REST endpoints consumed by both web and mobile.
- **`apps/mobile`**: Application side. Built with React Native 18.3.1, Expo SDK 52, Expo Router, and React Native Reanimated. Provides iOS/Android native mobile experience with offline-first caching.

---

## 🛡️ Critical Governance Rules

1. **Dual-Platform Parity:**
   - Any feature or data model change MUST be synchronized across both Web and Mobile.
   - Never implement a feature on Web and leave Mobile broken or lagging with outdated schemas.
2. **Contract-First Development:**
   - Changes always begin in `packages/shared/` before touching `apps/web/app/api/` or client UIs.
3. **4 Question Type Integrity & Exhaustiveness:**
   - LearnAxia supports `FLASHCARD`, `MC` (Multiple Choice), `TRUE_FALSE`, and `GAP` (Gap Fill).
   - In all dropdowns, badges, filters, study screens, and collection views, all 4 question types must have explicit labels and translations. Never collapse `TRUE_FALSE` and `GAP` into generic "Modül" or omit them.
4. **Single Question Type per Module (Homogeneous Modules Invariant):**
   - A module in LearnAxia has exactly ONE question type chosen at creation (`FLASHCARD`, `MC`, `TRUE_FALSE`, or `GAP`).
   - All questions/items inside a module strictly belong to that chosen type.
   - Per-card question type switchers or heterogeneous/mixed card modules are STRICTLY FORBIDDEN. Mixed question types is a separate, future planned roadmap feature.
5. **Predefined Categories & Subcategories (No Free-Text):**
   - Categories and subcategories MUST ALWAYS be selected from `@learnaxia/shared` (`CATEGORIES` and `MAIN_CATEGORIES`).
   - Free-text category inputs are STRICTLY PROHIBITED in both Web and Mobile.
   - The selected main category must dynamically dictate the available subcategories.
6. **Visibility & Discoverability Parity:**
   - Both Modules and Collections have `PUBLIC` and `PRIVATE` visibility.
   - When `PUBLIC`, Category and SubCategory are mandatory.
   - Search & Discover endpoints (`/api/mobile/discover`, etc.) and UI chips MUST support category filtering for both Modules and Collections.
7. **Name vs Handle:**
   - `name`: User's full name (supports UTF-8 / Turkish characters and spaces).
   - `handle`: Unique `@username` slug. Never confuse or combine them.
8. **Dependency Boundary:**
   - Respect root `package.json` overrides: `apps/mobile` strictly uses React 18.3.1 for Expo SDK 52 compatibility.
9. **No Dropped Mobile Fields / Full Feature Parity:**
   - When an entity or form has fields (e.g., `visibility`, `category`, `subCategory`, `description`), Mobile must NEVER drop them or hardcode them; full functional parity is mandatory.

---

## 🧭 Active Agent Skills
- `monorepo-platform-orchestrator`: Master coordinator for tasks across Web, Mobile, and Shared packages.
- `architecture-consistency-enforcer`: Prevents code drift and technical debt.
- `expo-native-expert`: Mobile ergonomics, routing, and 60fps animations.
- `frontend-design`: Premium UI design standards.
- `code-simplifier`: Clean, maintainable refactoring without behavioral alterations.
- `feature-dev`: Structured 5-phase incremental development.
