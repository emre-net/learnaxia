# Project Tasks - Learnaxia Stabilizasyon ve Üretime Hazırlık

- [x] Analyze full codebase (Cycle 1 & Cycle 2 Audit Complete)
- [x] Stabilize Mobile Entry Point (`apps/mobile/index.js` upgraded to `ExpoRoot` context with Expo Router v4)
- [x] Unify Mobile & Web Auth Guard with Centralized Session Versioning (`apps/web/auth.ts`)
- [x] Improve Architecture Documentation (Reflect accurate Expo SDK 52 / React 18/19 matrix)
- [x] Phase 1 Dual-Platform Stabilization & Dark Zinc (`#09090b` / `#121215` / `#18181b` / `#38bdf8`) Overhaul across Shared, Web, and Mobile
- [x] Unify Auth Validation (`handle` required / `name` optional), Tier/Badge Logic, Study Evaluation (`MC`/`TRUE_FALSE`/`GAP`), Hybrid BlockNote+SVG Notes, and LaTeX Rendering in `@learnaxia/shared`
- [x] Consolidate Redundant Optional Dependencies (`@tiptap/*`, `groq-sdk`, `react-quill`, `@nextui-org/react`, `react-big-calendar`, `react-native-webview`) while keeping `prosemirror-view`/`yjs`/`y-prosemirror`/`y-protocols` for hoisted `@blocknote/core` & Align Web React `19.0.0` + `ignoreDuringBuilds: false`
- [x] Establish & Expand Mobile Jest Test Infrastructure (`api.test.ts`, `auth-schema.test.ts`, `shared-content-utils.test.ts`, `offline-storage.test.ts`)
- [ ] Run Post-Overhaul Real Android Hardware / Production E2E Smoke Verification & Profile Heavy API Routes (Next Phase)
