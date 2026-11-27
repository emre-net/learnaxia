export type TokenActionType =
  | 'AI_MODULE'
  | 'AI_NOTE'
  | 'AI_PHOTO_SOLVE'
  | 'AI_JOURNEY_SYLLABUS'
  | 'AI_JOURNEY_MODIFY'
  | 'AI_JOURNEY_SLIDE';

export type TokenTransactionSource =
  | 'DAILY_FREE'
  | 'BONUS_SPEND'
  | 'REWARDED_AD'
  | 'ADMIN_GRANT'
  | 'REFUND';

export const TOKEN_CONFIG = {
  DAILY_FREE_TOKENS: 30,
  REWARDED_AD_BONUS: 20,
  MAX_DAILY_REWARDED_ADS: 8,
  MAX_BONUS_TOKEN_BALANCE: 500,
  COSTS: {
    AI_MODULE: 10,
    AI_NOTE: 8,
    AI_PHOTO_SOLVE: 10,
    AI_JOURNEY_SYLLABUS: 12,
    AI_JOURNEY_MODIFY: 6,
    AI_JOURNEY_SLIDE: 2,
  } satisfies Record<TokenActionType, number>,
} as const;

export interface TokenBalanceSummary {
  dailyFreeLimit: number;
  dailyFreeUsed: number;
  dailyFreeRemaining: number;
  bonusTokens: number;
  totalAvailable: number;
  dailyAdsWatched: number;
  dailyAdsRemaining: number;
  maxDailyAds: number;
  rewardedAdBonus: number;
  nextResetAt: string;
}

export interface TokenTransactionRecord {
  id: string;
  amount: number;
  balanceAfter: number;
  source: TokenTransactionSource;
  action: string | null;
  createdAt: string;
}
