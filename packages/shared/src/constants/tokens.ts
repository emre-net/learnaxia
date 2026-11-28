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

const ACTION_LABELS_TR: Record<string, string> = {
  AI_MODULE: 'AI Modül Üretimi',
  AI_NOTE: 'AI Not Çıkarma',
  AI_PHOTO_SOLVE: 'AI Fotoğraf Çözümü',
  AI_JOURNEY_SYLLABUS: 'AI Rota Müfredatı',
  AI_JOURNEY_MODIFY: 'AI Rota Düzenleme',
  AI_JOURNEY_SLIDE: 'AI Rota Slaytı',
};

const ACTION_LABELS_EN: Record<string, string> = {
  AI_MODULE: 'AI Module Generation',
  AI_NOTE: 'AI Note Summary',
  AI_PHOTO_SOLVE: 'AI Photo Solver',
  AI_JOURNEY_SYLLABUS: 'AI Journey Syllabus',
  AI_JOURNEY_MODIFY: 'AI Journey Edit',
  AI_JOURNEY_SLIDE: 'AI Journey Slide',
};

const SOURCE_LABELS_TR: Record<string, string> = {
  DAILY_FREE: 'Günlük Ücretsiz Kota',
  BONUS_SPEND: 'Bonus Jeton Harcaması',
  REWARDED_AD: 'Ödüllü Reklam Bonusu',
  ADMIN_GRANT: 'Yönetici Jeton Hediyesi',
  REFUND: 'Otomatik AI İadesi',
};

const SOURCE_LABELS_EN: Record<string, string> = {
  DAILY_FREE: 'Daily Free Allowance',
  BONUS_SPEND: 'Bonus Token Spend',
  REWARDED_AD: 'Rewarded Ad Bonus',
  ADMIN_GRANT: 'Admin Bonus Grant',
  REFUND: 'Automatic AI Refund',
};

export function getTokenTransactionLabel(
  source: string,
  action?: string | null,
  lang: 'tr' | 'en' = 'tr'
): string {
  const actionMap = lang === 'en' ? ACTION_LABELS_EN : ACTION_LABELS_TR;
  const sourceMap = lang === 'en' ? SOURCE_LABELS_EN : SOURCE_LABELS_TR;
  const sourceText = sourceMap[source] || source;
  if (action && actionMap[action]) {
    return `${actionMap[action]} • ${sourceText}`;
  }
  return sourceText;
}
