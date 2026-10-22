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
3. **4 Question Type Integrity:**
   - LearnAxia supports `FLASHCARD`, `MC` (Multiple Choice), `TRUE_FALSE`, and `GAP` (Gap Fill). Never simplify or collapse these into a single type.
4. **Name vs Handle:**
   - `name`: User's full name (supports UTF-8 / Turkish characters and spaces).
   - `handle`: Unique `@username` slug. Never confuse or combine them.
5. **Dependency Boundary:**
   - Respect root `package.json` overrides: `apps/mobile` strictly uses React 18.3.1 for Expo SDK 52 compatibility.

---

## 🧭 Active Agent Skills
- `monorepo-platform-orchestrator`: Master coordinator for tasks across Web, Mobile, and Shared packages.
- `architecture-consistency-enforcer`: Prevents code drift and technical debt.
- `expo-native-expert`: Mobile ergonomics, routing, and 60fps animations.
- `frontend-design`: Premium UI design standards.
- `code-simplifier`: Clean, maintainable refactoring without behavioral alterations.
- `feature-dev`: Structured 5-phase incremental development.
