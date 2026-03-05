/**
 * Single source of truth for all token costs.
 * Server-side uses these for deduction; client imports for UI display.
 */
export const COSTS = {
    AI_GENERATION: 10,
    AI_GENERATION_FILE: 15,
} as const;

export const REWARDS = {
    AD_WATCH: 10,
    DAILY_LOGIN: 5,
    SIGNUP_BONUS: 50,
} as const;
