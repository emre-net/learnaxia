// lib/utils/token-calculator.ts
/**
 * A utility to estimate token usage and calculate dynamic costs for the AI.
 * This ensures we don't hit Groq's Tokens Per Minute (TPM) limits and 
 * appropriately charges the user based on the size of their request.
 */

interface TokenEstimateParams {
    text: string;           // The source text or input topic
    targetCount: number;    // How many items the user wants to generate
    model?: string;         // Optional: if we want different rules per model
    isVision?: boolean;     // Optional: if it's an image request rather than text
}

interface TokenEstimateResult {
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    totalTokens: number;
    willHitRateLimit: boolean;
    recommendedCost: number; // The amount of AXIA tokens to charge
}

// Groq's Llama-3.3-70b-versatile baseline limit for free/developer tier
const MAX_TPM_LIMIT = 12000;

// Base costs in AXIA Tokens
const BASE_GENERATION_COST = 10;
const BASE_VISION_COST = 15;

/**
 * Estimates token usage and calculates the dynamic cost for an AI generation request.
 */
export function calculateAITokensAndCost(params: TokenEstimateParams): TokenEstimateResult {
    const { text, targetCount, isVision = false } = params;

    // 1. Calculate Input Tokens (Prompt + Source Text)
    // A standard rule of thumb for English/Multilingual models is ~4 chars per token.
    // We add a 200 token buffer for the System Prompt instructions.
    let estimatedInputTokens = Math.ceil(text.length / 4) + 200;

    if (isVision) {
        // Vision models use a fixed base token amount + variable based on resolution.
        // We estimate a high-res image analysis to be around 1000 input tokens.
        estimatedInputTokens += 1000;
    }

    // 2. Calculate Output Tokens (The Generated Items)
    // We estimate each flashcard/question generates roughly 50-80 tokens of JSON.
    // We'll use an upper bound of 80 tokens per item for safety, plus 50 for JSON overhead.
    // If auto-count (-1) is selected, we estimate based on the input text size (max 30 items)
    const effectiveCount = targetCount === -1
        ? Math.min(30, Math.max(5, Math.ceil(estimatedInputTokens / 300)))
        : targetCount;

    const estimatedOutputTokens = (effectiveCount * 80) + 50;

    // 3. Total Prediction
    let totalTokens = estimatedInputTokens + estimatedOutputTokens;

    // 4. Rate Limit Protection
    // We leave a 10% safety buffer to prevent edge cases from triggering 429s.
    const safeLimit = MAX_TPM_LIMIT * 0.9;
    const willHitRateLimit = totalTokens > safeLimit;

    // 5. Dynamic Pricing Calculation
    // Base cost + 1 token for every 500 extra AI tokens processed.
    let recommendedCost = isVision ? BASE_VISION_COST : BASE_GENERATION_COST;

    // Add dynamic scalar based on size
    if (totalTokens > 1000) {
        const extraTokens = totalTokens - 1000;
        recommendedCost += Math.ceil(extraTokens / 500);
    }

    return {
        estimatedInputTokens,
        estimatedOutputTokens,
        totalTokens,
        willHitRateLimit,
        recommendedCost
    };
}
