# Project Architecture - Learnaxia

## Overview
Learnaxia is a monorepo containing a web application (Next.js) and a mobile application (Expo).

## Components
- **apps/web**: Next.js 15 application with App Router.
- **apps/mobile**: Expo SDK 54 application with Expo Router.
- **packages/shared**: Shared business logic, types, and validation schemas.

## Tech Stack
- **Frameworks**: Next.js, Expo, React 19.
- **Styling**: Tailwind CSS v4 (Web), NativeWind v5 (Mobile).
- **Database**: Prisma with PostgreSQL.
- **Auth**: NextAuth.js (Web), JWT/Mobile-Auth Fallback (Mobile).
- **Build Tool**: Turborepo for monorepo management.
