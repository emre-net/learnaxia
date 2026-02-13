/**
 * Learnaxia SM-2 Hybrid Algorithm
 * Based on SuperMemo-2 with custom modifications for stability and "retirement".
 */

export const SM2_CONFIG = {
    initialEase: 2.5,
    minEase: 1.3,
    initialInterval: 1,
    minInterval: 1,
    maxInterval: 365,
    graduationInterval: 21,
    lapseMultiplier: 0.5,
    retirementThreshold: 90, // Days
    enableRetirement: true
};

export interface SM2Input {
    quality: number; // 0-5
    lastInterval: number;
    lastEase: number;
    repetition: number;
}

export interface SM2Output {
    nextInterval: number;
    nextEase: number;
    repetition: number;
    isRetired: boolean;
    nextReviewDate: Date;
}

/**
 * Calculates the next review schedule based on the SM-2 algorithm.
 * @param input Current state of the item and the quality of the response.
 * @returns New state including next interval, ease factor, and review date.
 */
export function calculateSM2(input: SM2Input): SM2Output {
    let { quality, lastInterval, lastEase, repetition } = input;

    // 0. Input Guard
    if (quality < 0) quality = 0;
    if (quality > 5) quality = 5;

    let nextInterval: number;
    let nextEase: number;
    let nextRepetition: number;
    let isRetired = false;

    // 1. Correct Response (Quality >= 3)
    if (quality >= 3) {
        if (repetition === 0) {
            nextInterval = SM2_CONFIG.initialInterval;
            nextRepetition = 1;
        } else if (repetition === 1) {
            nextInterval = 6; // Standard SM-2 jump
            nextRepetition = 2;
        } else {
            nextInterval = Math.round(lastInterval * lastEase);
            nextRepetition = repetition + 1;
        }

        // Ease Factor Calculation
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        nextEase = lastEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    }
    // 2. Incorrect Response (Quality < 3)
    else {
        nextRepetition = 0;
        nextInterval = SM2_CONFIG.minInterval;
        // Punishment logic for ease?
        // In standard SM-2 output ease doesn't change on fail, but typically we might want to drop it slightly
        // logic: keep logic simple, maintain ease or drop lightly.
        // Standard SM-2: "If the quality response was lower than 3 then start repetitions for the item from the beginning without changing the E-Factor".
        // We will stick to Standard SM-2 for failure: RESET interval, KEEP ease.
        nextEase = lastEase;
    }

    // 3. Constraints
    if (nextEase < SM2_CONFIG.minEase) {
        nextEase = SM2_CONFIG.minEase;
    }

    if (nextInterval > SM2_CONFIG.maxInterval) {
        nextInterval = SM2_CONFIG.maxInterval;
    }

    // 4. Retirement Check
    // If interval exceeds threshold, we consider it "mastered/retired" if enabled.
    if (SM2_CONFIG.enableRetirement && nextInterval >= SM2_CONFIG.retirementThreshold) {
        // Logic choice: Does retirement mean we stop reviewing? 
        // Or just that it's flagged?
        // For this app: It's a flag, but we still schedule it (capped at 365).
        isRetired = true;
    }

    // 5. Calculate Date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
    // Normalize to integer days if needed, but Date logic handles overflow.

    return {
        nextInterval,
        nextEase,
        repetition: nextRepetition,
        isRetired,
        nextReviewDate
    };
}

/**
 * Helper to get initial state for a new card
 */
export function getInitialSM2State(): SM2Output {
    return {
        nextInterval: 0,
        nextEase: SM2_CONFIG.initialEase,
        repetition: 0,
        isRetired: false,
        nextReviewDate: new Date() // Due immediately
    }
}
