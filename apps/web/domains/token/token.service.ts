import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
    TOKEN_CONFIG,
    TokenActionType,
    TokenBalanceSummary,
} from "@learnaxia/shared";

interface LockedWalletRow {
    id: string;
    aiBonusTokens: number;
    dailyFreeUsed: number;
    dailyFreeResetAt: Date;
    dailyAdRewardsCount: number;
    dailyAdResetAt: Date;
}

export interface TokenReservation {
    action: TokenActionType;
    fromDaily: number;
    fromBonus: number;
    totalSpent: number;
    wallet: TokenBalanceSummary;
}

export class InsufficientTokensError extends Error {
    public readonly required: number;
    public readonly available: number;
    public readonly wallet: TokenBalanceSummary;

    constructor(required: number, wallet: TokenBalanceSummary) {
        super(`Bu işlem için ${required} AI jetonu gerekiyor, mevcut bakiyeniz ${wallet.totalAvailable}.`);
        this.name = "InsufficientTokensError";
        this.required = required;
        this.available = wallet.totalAvailable;
        this.wallet = wallet;
    }
}

export function getUtcDayStart(date: Date = new Date()): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function getNextUtcResetIso(date: Date = new Date()): string {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();
}

export function computeWalletSummary(row: {
    aiBonusTokens: number;
    dailyFreeUsed: number;
    dailyFreeResetAt: Date;
    dailyAdRewardsCount: number;
    dailyAdResetAt: Date;
}, now: Date = new Date()): TokenBalanceSummary {
    const todayStart = getUtcDayStart(now);
    const effectiveDailyUsed = row.dailyFreeResetAt < todayStart ? 0 : Math.max(0, row.dailyFreeUsed);
    const effectiveDailyAds = row.dailyAdResetAt < todayStart ? 0 : Math.max(0, row.dailyAdRewardsCount);
    const dailyFreeRemaining = Math.max(0, TOKEN_CONFIG.DAILY_FREE_TOKENS - effectiveDailyUsed);
    const bonusTokens = Math.max(0, row.aiBonusTokens);

    return {
        dailyFreeLimit: TOKEN_CONFIG.DAILY_FREE_TOKENS,
        dailyFreeUsed: effectiveDailyUsed,
        dailyFreeRemaining,
        bonusTokens,
        totalAvailable: dailyFreeRemaining + bonusTokens,
        dailyAdsWatched: effectiveDailyAds,
        dailyAdsRemaining: Math.max(0, TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS - effectiveDailyAds),
        maxDailyAds: TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS,
        rewardedAdBonus: TOKEN_CONFIG.REWARDED_AD_BONUS,
        nextResetAt: getNextUtcResetIso(now),
    };
}

export function insufficientTokensResponse(err: InsufficientTokensError, status: number = 402) {
    return NextResponse.json(
        {
            code: "INSUFFICIENT_TOKENS",
            error: err.message,
            message: err.message,
            required: err.required,
            available: err.available,
            wallet: err.wallet,
        },
        { status }
    );
}

export class TokenService {
    static async getWalletSummary(userId: string): Promise<TokenBalanceSummary> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                aiBonusTokens: true,
                dailyFreeUsed: true,
                dailyFreeResetAt: true,
                dailyAdRewardsCount: true,
                dailyAdResetAt: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return computeWalletSummary(user);
    }

    static async getHistory(userId: string, limit: number = 30) {
        return prisma.tokenTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: Math.min(Math.max(limit, 1), 100),
            select: {
                id: true,
                amount: true,
                balanceAfter: true,
                source: true,
                action: true,
                createdAt: true,
            },
        });
    }

    static async reserveTokens(
        userId: string,
        action: TokenActionType,
        metadata?: Record<string, unknown>
    ): Promise<TokenReservation> {
        const cost = TOKEN_CONFIG.COSTS[action];
        const now = new Date();
        const todayStart = getUtcDayStart(now);

        return prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<LockedWalletRow[]>`
                SELECT "id", "aiBonusTokens", "dailyFreeUsed", "dailyFreeResetAt", "dailyAdRewardsCount", "dailyAdResetAt"
                FROM "User"
                WHERE "id" = ${userId}
                FOR UPDATE
            `;

            const row = rows[0];
            if (!row) {
                throw new Error("User not found");
            }

            const currentDailyUsed = row.dailyFreeResetAt < todayStart ? 0 : Math.max(0, row.dailyFreeUsed);
            const currentDailyReset = row.dailyFreeResetAt < todayStart ? now : row.dailyFreeResetAt;
            const currentAdsCount = row.dailyAdResetAt < todayStart ? 0 : Math.max(0, row.dailyAdRewardsCount);
            const currentAdsReset = row.dailyAdResetAt < todayStart ? now : row.dailyAdResetAt;

            const currentSummary = computeWalletSummary(
                {
                    aiBonusTokens: row.aiBonusTokens,
                    dailyFreeUsed: currentDailyUsed,
                    dailyFreeResetAt: currentDailyReset,
                    dailyAdRewardsCount: currentAdsCount,
                    dailyAdResetAt: currentAdsReset,
                },
                now
            );

            if (currentSummary.totalAvailable < cost) {
                throw new InsufficientTokensError(cost, currentSummary);
            }

            const fromDaily = Math.min(currentSummary.dailyFreeRemaining, cost);
            const fromBonus = cost - fromDaily;
            const nextDailyUsed = currentDailyUsed + fromDaily;
            const nextBonus = Math.max(0, row.aiBonusTokens - fromBonus);

            await tx.user.update({
                where: { id: userId },
                data: {
                    dailyFreeUsed: nextDailyUsed,
                    dailyFreeResetAt: currentDailyReset,
                    aiBonusTokens: nextBonus,
                    dailyAdRewardsCount: currentAdsCount,
                    dailyAdResetAt: currentAdsReset,
                },
            });

            const nextSummary = computeWalletSummary(
                {
                    aiBonusTokens: nextBonus,
                    dailyFreeUsed: nextDailyUsed,
                    dailyFreeResetAt: currentDailyReset,
                    dailyAdRewardsCount: currentAdsCount,
                    dailyAdResetAt: currentAdsReset,
                },
                now
            );

            await tx.tokenTransaction.create({
                data: {
                    userId,
                    amount: -cost,
                    balanceAfter: nextSummary.totalAvailable,
                    source: fromBonus > 0 && fromDaily === 0 ? "BONUS_SPEND" : "DAILY_FREE",
                    action,
                    metadata: (metadata || undefined) as Prisma.InputJsonValue | undefined,
                },
            });

            return {
                action,
                fromDaily,
                fromBonus,
                totalSpent: cost,
                wallet: nextSummary,
            };
        });
    }

    static async refundTokens(
        userId: string,
        reservation: TokenReservation,
        reason?: string
    ): Promise<TokenBalanceSummary | null> {
        const now = new Date();
        const todayStart = getUtcDayStart(now);

        try {
            return await prisma.$transaction(async (tx) => {
                const rows = await tx.$queryRaw<LockedWalletRow[]>`
                    SELECT "id", "aiBonusTokens", "dailyFreeUsed", "dailyFreeResetAt", "dailyAdRewardsCount", "dailyAdResetAt"
                    FROM "User"
                    WHERE "id" = ${userId}
                    FOR UPDATE
                `;

                const row = rows[0];
                if (!row) return null;

                const sameDay = row.dailyFreeResetAt >= todayStart;
                const nextDailyUsed = sameDay
                    ? Math.max(0, row.dailyFreeUsed - reservation.fromDaily)
                    : 0;
                const nextBonus = Math.min(
                    TOKEN_CONFIG.MAX_BONUS_TOKEN_BALANCE,
                    Math.max(0, row.aiBonusTokens) + reservation.fromBonus
                );

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        dailyFreeUsed: nextDailyUsed,
                        aiBonusTokens: nextBonus,
                    },
                });

                const nextSummary = computeWalletSummary(
                    {
                        aiBonusTokens: nextBonus,
                        dailyFreeUsed: nextDailyUsed,
                        dailyFreeResetAt: row.dailyFreeResetAt,
                        dailyAdRewardsCount: row.dailyAdRewardsCount,
                        dailyAdResetAt: row.dailyAdResetAt,
                    },
                    now
                );

                await tx.tokenTransaction.create({
                    data: {
                        userId,
                        amount: reservation.totalSpent,
                        balanceAfter: nextSummary.totalAvailable,
                        source: "REFUND",
                        action: reservation.action,
                        metadata: (reason ? { reason } : undefined) as Prisma.InputJsonValue | undefined,
                    },
                });

                return nextSummary;
            });
        } catch (err) {
            console.error("[TokenService] Refund failed:", err);
            return null;
        }
    }

    static async creditRewardedAd(params: {
        userId: string;
        transactionId: string;
        rewardAmount?: number;
        metadata?: Record<string, unknown>;
    }): Promise<{
        credited: boolean;
        duplicate?: boolean;
        capReached?: boolean;
        wallet?: TokenBalanceSummary;
    }> {
        const { userId, transactionId, rewardAmount, metadata } = params;
        const now = new Date();
        const todayStart = getUtcDayStart(now);
        const safeGrant = Math.min(
            Math.max(rewardAmount || TOKEN_CONFIG.REWARDED_AD_BONUS, 1),
            TOKEN_CONFIG.REWARDED_AD_BONUS
        );

        return prisma.$transaction(async (tx) => {
            const existing = await tx.tokenTransaction.findUnique({
                where: { externalTxId: transactionId },
                select: { id: true },
            });
            if (existing) {
                return { credited: false, duplicate: true };
            }

            const rows = await tx.$queryRaw<LockedWalletRow[]>`
                SELECT "id", "aiBonusTokens", "dailyFreeUsed", "dailyFreeResetAt", "dailyAdRewardsCount", "dailyAdResetAt"
                FROM "User"
                WHERE "id" = ${userId}
                FOR UPDATE
            `;

            const row = rows[0];
            if (!row) {
                throw new Error("User not found");
            }

            const adsToday = row.dailyAdResetAt < todayStart ? 0 : Math.max(0, row.dailyAdRewardsCount);
            if (adsToday >= TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS) {
                const wallet = computeWalletSummary(row, now);
                return { credited: false, capReached: true, wallet };
            }

            const nextAdsCount = adsToday + 1;
            const nextBonus = Math.min(
                TOKEN_CONFIG.MAX_BONUS_TOKEN_BALANCE,
                Math.max(0, row.aiBonusTokens) + safeGrant
            );
            const appliedDelta = nextBonus - Math.max(0, row.aiBonusTokens);

            await tx.user.update({
                where: { id: userId },
                data: {
                    aiBonusTokens: nextBonus,
                    dailyAdRewardsCount: nextAdsCount,
                    dailyAdResetAt: now,
                },
            });

            const nextSummary = computeWalletSummary(
                {
                    aiBonusTokens: nextBonus,
                    dailyFreeUsed: row.dailyFreeUsed,
                    dailyFreeResetAt: row.dailyFreeResetAt,
                    dailyAdRewardsCount: nextAdsCount,
                    dailyAdResetAt: now,
                },
                now
            );

            await tx.tokenTransaction.create({
                data: {
                    userId,
                    amount: appliedDelta,
                    balanceAfter: nextSummary.totalAvailable,
                    source: "REWARDED_AD",
                    externalTxId: transactionId,
                    metadata: (metadata || undefined) as Prisma.InputJsonValue | undefined,
                },
            });

            return { credited: true, wallet: nextSummary };
        });
    }

    static async adminGrantTokens(
        targetUserId: string,
        amount: number,
        adminId: string,
        reason?: string
    ): Promise<TokenBalanceSummary> {
        const clamped = Math.min(Math.max(Math.round(amount), 1), 500);
        const now = new Date();

        return prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<LockedWalletRow[]>`
                SELECT "id", "aiBonusTokens", "dailyFreeUsed", "dailyFreeResetAt", "dailyAdRewardsCount", "dailyAdResetAt"
                FROM "User"
                WHERE "id" = ${targetUserId}
                FOR UPDATE
            `;

            const row = rows[0];
            if (!row) {
                throw new Error("User not found");
            }

            const nextBonus = Math.min(
                TOKEN_CONFIG.MAX_BONUS_TOKEN_BALANCE * 2,
                Math.max(0, row.aiBonusTokens) + clamped
            );

            await tx.user.update({
                where: { id: targetUserId },
                data: { aiBonusTokens: nextBonus },
            });

            const nextSummary = computeWalletSummary(
                {
                    ...row,
                    aiBonusTokens: nextBonus,
                },
                now
            );

            await tx.tokenTransaction.create({
                data: {
                    userId: targetUserId,
                    amount: clamped,
                    balanceAfter: nextSummary.totalAvailable,
                    source: "ADMIN_GRANT",
                    metadata: ({ adminId, reason: reason || "Admin bonus token grant" }) as Prisma.InputJsonValue,
                },
            });

            return nextSummary;
        });
    }
}

/**
 * Reserves tokens atomically before executing an AI task and refunds automatically if upstream AI fails.
 */
export async function withTokenCharge<T>(
    userId: string,
    action: TokenActionType,
    work: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<{ result: T; wallet: TokenBalanceSummary }> {
    const reservation = await TokenService.reserveTokens(userId, action, metadata);
    try {
        const result = await work();
        return { result, wallet: reservation.wallet };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await TokenService.refundTokens(userId, reservation, msg);
        throw err;
    }
}
