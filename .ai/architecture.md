# Project Architecture - Learnaxia

## Overview
Learnaxia is a unified monorepo containing a modern web application (Next.js) and a mobile application (Expo / React Native) with shared business logic and contracts.

## Workspace Layout
- **apps/web**: Next.js 15 application with App Router, React 19, Tailwind CSS v4.
- **apps/mobile**: Expo SDK 52 application with Expo Router v4, React 18.3.1, React Native 0.76.9, NativeWind v2 & Tailwind CSS 3.4.16.
- **packages/shared**: Shared TypeScript types, validation schemas (Zod), and theme tokens.

## Tech Stack Matrix
- **Web Runtime**: Next.js 15.2.x, React 19.0.0, Tailwind CSS 4.1.x, Lucide React, Framer Motion.
- **Mobile Runtime**: Expo SDK ~52.0.49, React 18.3.1, React Native 0.76.9, NativeWind 2.0.11, Expo Router ~4.0.15.
- **Database**: Prisma ORM with PostgreSQL (hosted on Railway).
- **Authentication**:
  - Web: NextAuth.js v5 with Google OAuth & Credentials provider (JWT cookie strategy).
  - Mobile: Custom access JWT & refresh token flow, securely stored via `expo-secure-store`.
  - Unified Guard: Centralized `auth()` handler in `apps/web/auth.ts` validating both NextAuth sessions and Bearer JWTs with active session versioning (`sessionVersion`).
- **Monorepo Engine**: Turborepo v2 with npm workspaces.
