# Project Architecture - Learnaxia

## Overview
Learnaxia is a unified monorepo containing a modern web application (Next.js) and a mobile application (Expo / React Native) with shared business logic and contracts.

## Workspace Layout
- **apps/web**: Next.js 15 application with App Router, React 19, Tailwind CSS v4.
- **apps/mobile**: Expo SDK 52 application with Expo Router v4, React 18.3.1, React Native 0.76.9, NativeWind v2 & Tailwind CSS 3.4.16.
- **packages/shared**: Shared TypeScript types, validation schemas (Zod), and theme tokens.

## Tech Stack Matrix
- **Shared Core (`@learnaxia/shared`)**: Single source of truth for Zod auth/domain schemas (`LoginSchema`, `RegisterSchema`, `ProfileUpdateSchema`, `ChangePasswordSchema`), 4 homogeneous module/question types (`FLASHCARD`, `MC`, `TRUE_FALSE`, `GAP`), `CATEGORIES`, `TIERS`, `BADGE_DEFINITIONS`, `i18n` (`DEFAULT_LANGUAGE = 'tr'`), `DrawingCanvasData`, `parseNoteContent`/`serializeNoteContent`, `parseGapSegments`/`evaluateGapAnswers`/`resolveTrueFalseAnswer`, and `formatLatexToUnicode`/`parseRichContentBlocks`.
- **Web Runtime**: Next.js 15.2.x, React 19.0.0, Tailwind CSS 4.1.x, Lucide React, Framer Motion (`ignoreDuringBuilds: false`).
- **Mobile Runtime**: Expo SDK ~52.0.49, React 18.3.1, React Native 0.76.9, NativeWind 2.0.11, Expo Router ~4.0.15, Reanimated + Gesture Handler, `OfflineStorageService` (`withLock` write mutex + dead-letter queue + `clearAllUserData`), SVG `viewBox` `DrawingCanvas`, `<NativeRichText />`.
- **Database**: Prisma ORM with PostgreSQL (hosted on Railway); dormant Admin panel models (`Exam`, `ExamAttempt`, `WeaknessReport`) retained for Admin operations.
- **Authentication & User Sync**:
  - Web: NextAuth.js v5 with Google OAuth & Credentials provider (JWT cookie strategy).
  - Mobile: Custom access JWT & refresh token flow stored via `expo-secure-store` with automatic cleanup (`clearAllUserData`) on logout/refresh expiry.
  - Unified API & Guard: Centralized `auth()` / `getMobileUser(req)` across Web & Mobile routes including shared `/api/user/settings` and `/api/user/password`.
- **Monorepo Engine**: Turborepo v2 with npm workspaces.
