# LearnAxia Phase 1: Cross-Platform Stabilization, Full Parity & Dark Zinc UI Overhaul Plan

> **For agentic workers:** Execute wave-by-wave cleanly, verifying `tsc`, `lint`, and unit tests after each major layer (`packages/shared`, API/Backend, Web UI, Mobile UI) before closing with full monorepo verification and durable documentation updates to `AGENTS.md` and `.ai/`.

**Goal:** Eliminate every security vulnerability, study/SM-2 data corruption bug, AI model mismatch, drawing/note incompatibility, and multi-agent drift across Web (`apps/web`), Mobile (`apps/mobile`), and Shared (`packages/shared`), while unifying both platforms onto the `#09090b` Dark Zinc Content-First UI system (with Web mobile/tablet views closely aligned to the native Mobile experience).

**Explicit Exclusions (Confirmed by User):**
- Keep dormant Prisma models (`Exam`, `ExamAttempt`, `WeaknessReport`) intact for admin/script workflows.
- Exclude Phase 2/3 feature expansion (no Podcast Audio Overview, pgvector RAG, Live WebSocket Study Rooms, full SQLite/RevenueCat rewrite).

---

## Architecture Decisions & Multi-Agent Drift Resolution

1. **Unified Auth Contract (`@learnaxia/shared`) — Rule 7 Aligned:**
   - Replace divergent Web (`username` required, `name` missing, form `min(6)` vs backend `min(8)`), Mobile (`name` required, `handle` optional, `min(6)`), and duplicate `apps/web/lib/validations/mobile-auth.ts` with ONE shared validation contract in `packages/shared/src/validation/auth.schema.ts`:
     - `handle`: **required** (`min 3`, `max 24`, `/^[a-zA-Z0-9_-]+$/`).
     - `name`: **optional** (UTF-8 letters/spaces supported; blank/`""` treated cleanly as `undefined`).
     - `password`: **`min(8)`** consistently for **Register** and **Reset/Change Password** across Web UI, Mobile UI, Web API, and Mobile API. **`min(6)`** on **Login** so pre-existing test/demo accounts are never locked out.
   - Maintain exported backward-compatible aliases (`MobileRegisterSchema`, `MobileLoginSchema`) while removing `apps/web/lib/validations/mobile-auth.ts`.

2. **Homogeneous 4-Type Integrity & Shared Scoring (`@learnaxia/shared`) — Rules 3, 4, 12:**
   - Clean `packages/shared/src/domain-types/module.types.ts`: remove forbidden `'MIXED'`, `'NOTE'`, `'QUIZ'` module types; standardize `ModuleType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP'` and `StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW' | 'QUIZ' | 'AI_SMART'`.
   - Move `BADGE_DEFINITIONS`, `BadgeKey`, `BadgeDetail`, `computeEarnedBadges`, and `getBadgeDetails` from `apps/web/lib/scoring/badges.ts` into `packages/shared/src/constants/badges.ts` so Mobile Profile uses the exact same Tier & Badge definitions (removing custom `Lvl ${Math.floor(allTime / 500) + 1}`).

3. **Unified Study Grading & Card Physics:**
   - Preserve 4-level SM-2 grading (**Tekrar (1) / Zor (2) / İyi (4) / Kolay (5)**) on both Web and Mobile in consistent `#09090b` / `#121215` Zinc controls.
   - Add smooth **Reanimated + Gesture Handler swipe shortcut** on Mobile flashcards (**Right = İyi (4)**, **Left = Tekrar (1)**) while keeping bottom SM-2 buttons for granular Zor/Kolay selection.
   - Fix **critical Mobile MC/TF/GAP double-counting & `quality: 3` corruption**: interactive cards compute exact `quality` (`isCorrect ? 4 : 1`), defer logging to advancing card without incrementing `totalAnswered`/`correctCount` twice, and evaluate `boolean false` / `{{gap}}` / Turkish casing (`toLocaleLowerCase('tr')`) accurately.
   - Build native Web `TrueFalseRenderer` alongside updated `FlashcardRenderer`, `QuizRenderer`, and `GapRenderer` (fixing light-mode `bg-green-50` classes, broken `"Image"` placeholder, wrong gap array lookup, and adding clean **HTML / Markdown / KaTeX** math rendering across BOTH Web and Mobile study cards, solutions, and journeys).

4. **Bidirectional Hybrid Notes & Vector Drawing Canvas (`@learnaxia/shared`):**
   - Add `canvasWidth?: number` to `DrawingCanvasData` / `DrawingPayload` in `@learnaxia/shared`.
   - Fix Mobile `DrawingCanvas` stale `PanResponder` `useRef` closure (sync tool/color/width/path/width via mutable refs + `onLayout` `canvasWidth`).
   - Add lightweight interactive **SVG Vector Drawing Pad** (`web` Note `BlockEditor`) using pointer events with matching Zinc toolbar & pen/highlighter/eraser/undo/redo/clear so drawings can be created AND edited seamlessly on BOTH Web and Mobile (`viewBox="0 0 ${canvasWidth || 400} ${canvasHeight || 320}"`).
   - Create shared note normalizers (`parseNoteContent`, `serializeNoteContent`, `extractNotePlainText`) in `@learnaxia/shared`: parse HTML (AI notes), BlockNote `PartialBlock[]`, `{ text, drawing }`, and plain text cleanly without silently destroying Web BlockNote formatting when edited from Mobile.

5. **Web ↔ Mobile Responsive & Design System Unification — Rule 11 & Spec:**
   - Standardize Web `globals.css`, `sidebar.tsx`, `dashboard/page.tsx`, `layout.tsx`, analytics charts, `ScoreCard`, `BadgeList`, auth/reset/onboarding/summary/error surfaces onto **`#09090b` / `#121215` / `#18181b` / `#f4f4f5`** Dark Zinc tokens matching `apps/mobile` and Landing/Login.
   - Align Web Dashboard with Mobile Home: Content-First (`Story Bubbles` + `Kaldığın Yerden Devam Et` + Compact Momentum/Tier Strip + `DailyReviewWidget` + `FocusWidget` + `Son Aktiviteler`), moving raw 4-stat telemetry boxes to Analytics where they belong.
   - Fix Web tablet navigation gap (`MobileSidebar` `lg:hidden` instead of `md:hidden`), make `MobileBottomNav` visually coherent with Mobile's `(tabs)/_layout.tsx` (centered floating `+` button), remove cramped `grid-cols-3` / `flex-1` tabs and tracked uppercase clichés across both platforms.
   - Complete Web Profile (surface `BadgeList` + `Journeys` + `AI Çözümleri` tabs — 5 Library Entities parity) and wire all dead UI controls (`PricingSection` links, `Şifre Değiştir` modal + endpoint, `SystemPreferences` persistence, `Admin` filters/search).

6. **Database Compatibility Without Destructive prod Migrations:**
   - Persist `bookmarkedItemIds`, `journeyProgress` (`Record<string, number>`), and user `preferences` (`notifications`, `soundEnabled`, `showStudyTimer`) inside existing `User.settings` JSON (`schema.prisma:19`).
   - Fix **Daily Mixed Study 500** (`start-daily` Web & Mobile) by creating one `LearningSession` per distinct `moduleId` in the due batch and returning `sessionMap: Record<string, string>` so `ProgressService.recordItemResult` logs every card against its authentic module.

---

## Execution Waves

### Wave 0: `packages/shared` (Single Source of Truth)
- [ ] `packages/shared/src/validation/auth.schema.ts`: Unified `LoginSchema`, `RegisterSchema` (`handle` required, `name` optional, `password` min 8), `ResetPasswordSchema`, `ForgotPasswordSchema`, `ChangePasswordSchema`, `ProfileUpdateSchema` + backwards-compatible `MobileLoginSchema` / `MobileRegisterSchema` exports.
- [ ] `packages/shared/src/domain-types/module.types.ts`: Enforce strict 4 types (`FLASHCARD`, `MC`, `TRUE_FALSE`, `GAP`) & canonical `StudyMode`; remove `'MIXED' | 'NOTE' | 'QUIZ'`.
- [ ] `packages/shared/src/domain-types/drawing.types.ts`: Add `canvasWidth?: number` to `DrawingPayload` / `DrawingCanvasData`.
- [ ] `packages/shared/src/constants/badges.ts` & `constants/index.ts`: Move `BADGE_DEFINITIONS`, `BadgeKey`, `BadgeDetail`, `computeEarnedBadges`, `getBadgeDetails`, `EarnedBadgesInput` from `apps/web/lib/scoring/badges.ts` into shared.
- [ ] `packages/shared/src/utils/content.ts` & `utils/note.ts` & `utils/errors.ts`: Add `extractGapSegments`, `normalizeGapAnswer` (`toLocaleLowerCase('tr')`), `normalizeStudyItem` (`TRUE_FALSE` boolean/string + `GAP` + `MC` + `FLASHCARD`), `parseNoteContent`, `serializeNoteContent`, `extractNotePlainText`, `extractApiErrorMessage`.
- [ ] `packages/shared/src/i18n/dictionaries.ts`: Add missing keys (`library.tabs.journeys`, `library.tabs.solutions`, `study.swipeHint`, `study.types.*`, dynamic analytics strings without fake `%12` text, auth min-8 validation labels).

### Wave 1: `apps/web` API Routes, Services, Security & AI Fixes
- [ ] Security fixes:
  - `apps/web/domains/study/study.service.ts`: Fix `isPrivateLinked` CRITICAL bypass (`UserModuleLibrary` / `UserContentAccess` check instead of `visibility === 'PRIVATE'`); normalize `tut-3` to `{{bilimsel}}` & preserve `TRUE_FALSE` boolean answers explicitly.
  - `apps/web/app/api/user/profile/route.ts`: Require authenticated session; prevent arbitrary `?userId` PII/email leak.
  - `apps/web/app/api/discover/route.ts`: Enforce `visibility: 'PUBLIC'` in catch fallback.
  - `apps/web/app/api/admin/sync-visibility/route.ts`: Enforce active session/admin guard alongside `SYNC_SECRET`.
  - `apps/web/domains/module/module.service.ts`: Scope `updateItem`/`deleteItem` with `moduleId` check (IDOR fix), support `visibility` on `create`, enforce homogeneous item `type === dto.type`.
  - `apps/web/app/api/mobile/refresh/route.ts`, `login/route.ts`, `register/route.ts`, `user/profile/route.ts`: Consumes `@learnaxia/shared`, includes `handle`, `language`, `role`, `tokenVersion`, and rejects `deletedAt`/suspended users. Remove `apps/web/lib/validations/mobile-auth.ts`.
  - `apps/web/app/api/auth/register/route.ts` & `reset-password/route.ts`: Consume shared `RegisterSchema` / `ResetPasswordSchema` (`handle` required, `name` optional, `password` min 8).
- [ ] AI Provider & Generator:
  - `apps/web/domains/ai/openai.provider.ts` & `official-generator.service.ts`: Set Groq default text model `llama-3.3-70b-versatile` & vision model `meta-llama/llama-4-scout-17b-16e-instruct`; enforce canonical `TRUE_FALSE` `answer: "True" | "False"` and valid `CATEGORIES`.
- [ ] API Parity & Broken Flows:
  - `apps/web/app/api/modules/route.ts`, `[id]/save/route.ts`, `[id]/items/route.ts`, `[id]/route.ts`: Add `visibility` + Rule 5/6 checks, add `DELETE` unsave handler, align item schemas (`TRUE_FALSE` + backward compat `'TF'`), return proper 401/403/404 status codes.
  - `apps/web/domains/collection/collection.service.ts`, `api/collections/route.ts`, `api/collections/[id]/route.ts`, `api/mobile/collections/[id]/route.ts`: Pass `isPublic: visibility === 'PUBLIC'`, fix category filter without search, preserve partial update fields, add Web `DELETE /api/collections/[id]` & fix Mobile `DELETE` FK cleanup (`userCollectionLibrary`).
  - `apps/web/app/api/study/start-daily/route.ts` & `api/mobile/study/start-daily/route.ts`: Return `sessionMap: Record<string, string>` (one `LearningSession` per distinct `moduleId` in batch) + normalized items!
  - `apps/web/app/api/scores/me/route.ts`: Eliminate double `calculateMomentum` call and always compute/return `badges` even on cache hit. Re-export shared badges from `apps/web/lib/scoring/badges.ts` and shared auth/validations cleanly.
  - `apps/web/app/api/mobile/library/route.ts`, `mobile/discover/route.ts`, `mobile/notes/[id]/route.ts`, `notes/[id]/route.ts`, `mobile/items/[itemId]/bookmark/route.ts`, `mobile/study/[id]/route.ts`, `mobile/journeys/[id]/progress/route.ts`, `solved-questions/[id]/route.ts`, `mobile/ai/solve-photo/route.ts`, `user/password/route.ts`, `mobile/user/password/route.ts`, `user/settings/route.ts`, `admin/logs/route.ts`, `admin/seed-test/route.ts`: Fix all 404/ownership/parity/payload bugs verified in audit.

### Wave 2: Web UI Overhaul & Functional Bugfixes (`apps/web`)
- [ ] **Design System & Shell (`#09090b` Dark Zinc + Responsive Mobile/Tablet Parity):**
  - `globals.css`: Convert `.dark` root CSS tokens from Midnight Ocean (`222 47% ...`) to pure Dark Zinc (`#09090b`, `#121215`, `#18181b`, `#27272a`, `#f4f4f5`).
  - `components/layout/sidebar.tsx` & `mobile-bottom-nav.tsx` & `app/dashboard/layout.tsx`: Replace `from-slate-900 to-black` & `md:hidden` tablet bug; match Mobile's clean bottom tab navigation with floating `+` Create button on `< 1024px`.
  - `app/dashboard/page.tsx`: Align strictly with Mobile Home (Content-First Story Bubbles + Continue Hero + Compact Momentum/Tier Strip + `DailyReviewWidget` + `FocusWidget` + `Son Aktiviteler`), removing bottom empty 4-KPI telemetry boxes; fix `ScoreCard` (`#121215`, remove 8-metric grid or keep lean tier + 3 key numbers), `BadgeList`, `daily-review-widget.tsx`, `focus-widget.tsx`, analytics tooltips, leaderboard `#08080F`.
- [ ] **Auth, Pricing, Onboarding, Settings, Profile:**
  - `components/auth/auth-form.tsx` & `reset-password-form.tsx`: Adopt shared `LoginSchema` / `RegisterSchema` (required `handle`, optional `name` input, `password` min 8), replace `bg-[#0A1128]`/`bg-[#0F172A]`/`bg-white text-zinc-900` drift with Zinc tokens.
  - `components/landing/pricing-section.tsx`: Wire CTA `<Link>` buttons (`/login?tab=register`, `/contact`).
  - `components/settings/account-section.tsx`, `edit-profile-dialog.tsx`, `system-preferences.tsx`: Implement working Change Password dialog + persistent `notifications`/`soundEnabled`/`showStudyTimer` settings via API; pass `name` to `EditProfileDialog`.
  - `app/dashboard/profile/profile-client.tsx`: Surface `BadgeList`, add `Journeys (Rotalar)` and `AI Çözümleri (Solved Questions)` tabs (5 entities parity), fix raw BlockNote snippet preview inside hybrid JSON notes.
- [ ] **Library, Discover, Notes + Interactive Vector Drawing, Collections, AI Solve-Photo & Creation:**
  - `app/dashboard/library/library-client.tsx`, `modules-tab.tsx`, `collections-tab.tsx`: Read `?tab=` query param, keep `<TabsList>` scrollable pill track visible even when filtered results are empty, fix collection CTA link to `/dashboard/collections/new`.
  - `app/dashboard/collections/new/page.tsx`: Parse `{ items }` response from `/api/modules`.
  - `app/dashboard/notes/[id]/page.tsx`, `components/notes/note-editor.tsx`, `block-editor.tsx`: Allow viewing `PUBLIC` notes, prevent duplicate row creation during debounce auto-save, fix SVG `viewBox` (`canvasWidth || 400`) + upgrade Web `BlockEditor` with interactive SVG Drawing Pad (`pen`/`highlighter`/`eraser`/`undo`/`redo`/`clear`) in `#121215`!
  - `app/dashboard/discover/discover-client.tsx` & `app/dashboard/create/solve-photo/page.tsx`: Parse note snippets safely (`extractNotePlainText`) instead of raw JSON HTML; resize/persist photo thumbnail (data URL) cleanly on solve-photo & delete solved questions; fix dark-zinc styles.
  - `components/create/ai-creation-wizard.tsx`, `item-editor-sheet.tsx`, `module/module-detail-client.tsx`: Add `category`/`subCategory`/`visibility` step cleanly to AI wizard, map all 4 item types (`front`/`back`, `statement`/`isTrue`, `text`/`answers`) cleanly in `ItemEditorSheet` & `ModuleDetailClient`, enable image upload/URL + delete/edit guards.
- [ ] **Web Study & Admin Polish:**
  - Add reusable `MathRichText` component (`katex` + safe HTML/markdown rendering — wait: check if `katex` or `@blocknote` already installed or lightweight zero-bloat math/HTML formatter cleanly!).
  - Update `flashcard-renderer.tsx`, `quiz-renderer.tsx`, `gap-renderer.tsx`, new `true-false-renderer.tsx`, `study-controls.tsx`, `study-summary.tsx`, `study/daily/page.tsx`: Real image rendering, fixed `GAP` grading & dark styles, real `TrueFalseRenderer`, SM-2 Dark Zinc buttons (`bg-zinc-900` variants instead of `bg-orange-100`), Daily session `sessionMap` tracking + fixed summary links.
  - Wire dead controls in `app/admin/modules/page.tsx` & `ai-logs/page.tsx`; clean `apps/web/package.json` unused deps (`@nextui-org/react`, `react-quill`, unused `tiptap`/`lowlight`, `groq-sdk`), duplicate `postbuild`, React RC drift, and re-enable/fix ESLint cleanly (`next.config.ts`).

### Wave 3: Mobile UI Overhaul & Bugfixes (`apps/mobile`)
- [ ] **Global Context & Gesture Root (`_layout.tsx`, `LanguageContext`, `AuthContext`, `Theme`):**
  - Replace isolated per-hook `useLanguage` state with a real `LanguageProvider` synced with `user?.language` and `AsyncStorage`.
  - Wrap root layout with `GestureHandlerRootView`; remove `LogBox.ignoreAllLogs()` blanket suppression (or filter only known harmless third-party warnings).
  - Fix root `app/index.tsx` login flash while `AuthContext` resolves; notify `AuthContext` + clear `OfflineStorageService` user-scoped caches on failed refresh or logout (`learnaxia_module_*`, `learnaxia_note_*`, `learnaxia_offline_*`).
  - Tighten `OfflineStorageService`: async mutex lock on queue writes, dead-letter tracking instead of silent drop after 3 retries, `queueStudySessionComplete` / daily caching support.
- [ ] **Auth, Home, Explore, Library Parity & #000/#fff Removal:**
  - `app/login.tsx`: Align with shared `RegisterSchema` (`handle` required, `name` optional, `password` min 8), Android `KeyboardAvoidingView`.
  - `app/(tabs)/index.tsx`, `components/dashboard/daily-review-widget.tsx`, `focus-widget.tsx`: Fix `router.push('/(tabs)/profile')`, remove dead `/mobile/analytics` fetch, sync `useLanguage`, eliminate `#000000`/`#FFFFFF` and uppercase tracked labels; surface item counts/progress cleanly on Continue Hero.
  - `app/(tabs)/explore.tsx` & `library.tsx`: Convert cramped `flex: 1` tab toggle to scrollable fluid pills, add `SubCategory` chips & Load-More pagination on Explore, add Question Type + Category + `Tümü / Oluşturduklarım / Kaydedilenler` filters on Library, replace `'Rotalar'` / `'AI Çözümleri'` hardcoded strings with `t(...)`, read `?tab=` query param cleanly!
- [ ] **Modules, Collections, Notes, DrawingCanvas, AI Create/Solution, Journeys:**
  - `components/drawing/drawing-canvas.tsx`: Fix stale `PanResponder` `useRef` closures + record dynamic `canvasWidth` + Dark Zinc surface (`#121215`, `#27272A`, `#F4F4F5`).
  - `app/notes/[id].tsx` & `app/notes/new.tsx`: Preserve Web BlockNote rich structure via `@learnaxia/shared` `parseNoteContent`/`serializeNoteContent`, add Delete Note button & `PUBLIC`/`PRIVATE` visibility toggle + StatusBar `#09090b`.
  - `app/modules/new.tsx` & `app/modules/[id].tsx`: Align validation with `@learnaxia/shared` (`min 3` title, predefined category fallback instead of `'Genel'`), add **Module Edit mode** (`?edit=` or sheet), Save/Fork CTA, Category badges, item images, and Retry on error.
  - `app/collections/[id].tsx` & `collections/new.tsx`: Fix crash on Add Module (`res.data?.items || res.data?.modules`), enforce `isOwner` guard on add/remove UI, add Save to Library, Edit, Category metadata.
  - `app/create.tsx`, `camera-screen.tsx`, `solution-modal.tsx`: Replace `#0D0D0D`/`#FFFFFF`/`#000000`, fix deprecated `ImagePicker.MediaTypeOptions`, include `.docx`/`.pptx` picker types, show loading overlay during extraction/solve, upgrade `SolutionModal` with **Not Al (Take Note)** + **Kaydedilen Görsel & İlişkili Notlar** + Delete support + KaTeX/HTML/Markdown math rendering!
  - `app/journey/new.tsx` & `app/journey/[id].tsx`: Add `goal` input, interactive step editing / AI modify (`Genişlet`/`Kısalt`/`Akademik`), render slide HTML cleanly (no literal `<h2>`/`<p>`!), implement error recovery retry on `generate-slide`, persist & resume `slideIndex`, enable interactive peeking quiz card & Delete Journey.
- [ ] **Mobile Study Experience (`study/[id].tsx`, `study/daily.tsx`, `mc-card.tsx`, `tf-card.tsx`, `gap-card.tsx`):**
  - Fix double-counting & `quality: 3` corruption on `MC`, `TRUE_FALSE`, `GAP`!
  - Fix `TRUE_FALSE` boolean `false` evaluation, `GAP` empty `answers` bug + `toLocaleLowerCase('tr')`.
  - Support `?mode=` (`NORMAL`, `SM2`, `WRONG_ONLY`, `REVIEW`, `QUIZ`, `AI_SMART`), `resumedFromIndex`, `StudyTimer` toggle, exit confirmation Alert, image rendering on cards, rich math/HTML card content, and Android `KeyboardAvoidingView` + `ScrollView` wrapping so long text or keyboard never clips submit buttons!
  - Implement smooth **Reanimated + Gesture Handler** card swipe (Right = İyi `4`, Left = Tekrar `1`) synchronized with the 4 SM-2 buttons at the bottom, plus persistent Bookmark toggle (`/mobile/items/[itemId]/bookmark`).
- [ ] **Mobile Profile, Analytics, Leaderboard & Cleanup:**
  - `app/(tabs)/profile.tsx`, `analytics.tsx`, `leaderboard.tsx`: Use `@learnaxia/shared` Tiers & Badges (with badge description modal on tap), monthly/all-time toggle, avatar clearing, deep-linked 5 library stat cards (`/library?tab=...`), persisted notification/sound/timer settings, real last-7-day calendar fill + `totalStudyMinutes` + `'tr-TR'`/`'en-US'` locale fix, Leaderboard Tier filter + Error/Retry UI.
  - Clean orphan files (`apps/mobile/crash_dump.txt`, `crash_log.txt`, `react-logo*.png`, unused starter wrappers `themed-text.tsx`/`themed-view.tsx`/`use-theme-color.ts`/`constants/theme.ts`/`reset-project.js`/duplicate `.eslintrc.js`/`app/global.css`), check unused `react-native-webview` (remove or use cleanly for KaTeX!), and eliminate all 23 ESLint warnings.

### Wave 4: Knowledge Governance, Cross-Platform Tests & Verification
- [ ] Update `AGENTS.md`, `.ai/DESIGN_SYSTEM_AND_UX_SPEC.md`, `.ai/architecture.md`, `.ai/project_tasks.md`, and `docs/mobile_troubleshooting_history.md` with ALL discovered multi-agent drift root causes, canonical contracts, Groovy/Groq models, SM-2 & Note serialization contracts, and UI rules.
- [ ] Save key architectural insights cleanly to `agentmemory`.
- [ ] Expand automated Jest unit tests (`apps/mobile` + `packages/shared` + critical Web services/utils: auth schema, study grading, gap parser, note serializer, OfflineStorage queue mutex).
- [ ] Run FULL verification cleanly after final edits:
  - `npx tsc -p packages/shared/tsconfig.json --noEmit` (if applicable) / build shared
  - `npx tsc -p apps/web/tsconfig.json --noEmit`
  - `npx tsc -p apps/mobile/tsconfig.json --noEmit`
  - `npm run lint` (0 errors, target 0 warnings!)
  - `npm test -w learnaxia-mobile`
  - `npm run build` / Next production build check
