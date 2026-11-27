# LearnAxia Free-Education Token Economy, Rewarded Ads & Usability Plan

## Goal
Align LearnAxia 100% with its non-subscription free-education mission while covering AI generation costs via an abuse-proof **Daily Free AI Quota + Rewarded Video Ad Token Economy** (shared across Web & Mobile via one account wallet), plus close the remaining usability gaps (`NetInfo` automatic offline sync + dead-letter recovery UI, active Admin User management, and duplicate Web collection route cleanup).

## Architecture Summary
1. **Contract-First (`packages/shared`)**:
   - `TOKEN_CONFIG`, `TokenActionType`, `TokenBalanceSummary`, `TokenTransactionRecord`, and `tr`/`en` dictionary entries live in `packages/shared`.
   - Core learning (`MANUAL`, `SM-2`, `FLASHCARD` swipe, `NOTES`, `DRAWING`, `LIBRARY`, `EXPLORE`, `COLLECTIONS`) remains **100% free and tokenless**.
2. **Database Ledger (`apps/web/prisma`)**:
   - Additive fields on `User`: `aiBonusTokens`, `dailyFreeUsed`, `dailyFreeResetAt`, `dailyAdRewardsCount`, `dailyAdResetAt`.
   - New immutable audit table `TokenTransaction` with unique `externalTxId` preventing AdMob SSV replay attacks.
   - Dormant models (`Exam`, `ExamAttempt`, `WeaknessReport`, `Plan`, `Subscription`, `Invoice`, `PaymentMethod`) kept non-destructively so zero existing tables drop.
3. **Server-Side Verification & Atomic Ledger (`apps/web`)**:
   - `TokenService` consumes `dailyFree` before `aiBonusTokens` inside an atomic Prisma `$transaction`, returns HTTP `402 INSUFFICIENT_TOKENS` with wallet details, and automatically refunds tokens when an AI upstream provider throws an error.
   - `GET /api/ads/admob-ssv` verifies Google AdMob ECDSA SHA-256 signatures against Google's official public verifier keys and idempotently credits `+20` bonus tokens per verified `transaction_id` up to daily limits.
   - All AI generation routes (`module`, `note`, `solve-photo`, `journey syllabus/modify/new-slide`) deduct/refund atomically after input validation.
4. **Web Realignment & Admin Actions (`apps/web`)**:
   - Rework `/pricing` and landing `PricingSection` + `/terms` Section 8 from "Pro 99" to the Free Education + AI Token Economy model.
   - Add `TokenWalletCard` in Settings & AI creation pages, handling `402` smoothly with guidance that mobile rewarded ads sync to the shared wallet.
   - Activate `AdminUsersClient` + `UserActions` (`/api/admin/users/[id]`) for search, suspend/activate, role toggle, and admin token grant.
   - Consolidate `/dashboard/collections/create` redirect to `/dashboard/collections/new`.
5. **Mobile AdMob Rewarded Ads & NetInfo Sync (`apps/mobile`)**:
   - Integrate `@react-native-community/netinfo@11.4.1` and `react-native-google-mobile-ads@^14.7.0` cleanly with Expo SDK 52 Old Architecture & AndroidManifest App ID configuration.
   - `RewardedAdService` passes `serverSideVerificationOptions: { userId }` and refreshes `useTokenWallet` on earned reward.
   - Global connectivity listener in `app/_layout.tsx` auto-flushes `OfflineStorageService.processSyncQueue(api)` on reconnect; `library.tsx` & `profile.tsx` surface pending/dead-letter sync UI with retry.
