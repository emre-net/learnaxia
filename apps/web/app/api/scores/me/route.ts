import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { calculateMomentum, saveAndRecalculate } from "@/lib/scoring/engine";
import { getTierForScore, getTierProgress, getPointsToNextTier } from "@/lib/scoring/tiers";
import { getBadgeDetails, type BadgeKey } from "@/lib/scoring/badges";
import { periodStart } from "@/lib/scoring/signals";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/scores/me
 * Kullanıcının güncel Momentum skoru, tier, rozetler ve görünür metrikler.
 */
export async function GET(req: Request) {
    try {
        let userId: string | undefined;

        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const period = periodStart();
        const [cached, userRow] = await Promise.all([
            prisma.userScore.findUnique({
                where: { userId_period: { userId, period } },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { settings: true },
            }),
        ]);

        const needsRecalc =
            !cached ||
            !cached.calculatedAt ||
            Date.now() - cached.calculatedAt.getTime() > 4 * 60 * 60 * 1000;

        let score = cached;
        let badgeKeys: BadgeKey[] = [];

        if (needsRecalc) {
            const recalcResult = await saveAndRecalculate(userId, period);
            score = await prisma.userScore.findUnique({
                where: { userId_period: { userId, period } },
            });
            badgeKeys = recalcResult.earnedBadges;
        } else {
            const settings = (userRow?.settings as Record<string, unknown>) ?? {};
            if (Array.isArray(settings.earnedBadges)) {
                badgeKeys = settings.earnedBadges as BadgeKey[];
            } else {
                // Eski cache kayıtlarında earnedBadges yoksa bir kere hesapla ve settings'e yaz
                const computed = await calculateMomentum(userId, period);
                badgeKeys = computed.earnedBadges;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        settings: {
                            ...settings,
                            earnedBadges: badgeKeys,
                        },
                    },
                });
            }
        }

        const allTimeAgg = await prisma.userScore.aggregate({
            where: { userId },
            _sum: { finalScore: true },
        });
        const allTimeMomentum = Math.round(allTimeAgg._sum.finalScore ?? 0);
        const allTimeTier = getTierForScore(allTimeMomentum);

        const monthScore = score?.finalScore ?? 0;
        const monthTier = getTierForScore(monthScore);
        const badges = getBadgeDetails(badgeKeys);

        return NextResponse.json({
            momentum: {
                thisMonth: Math.round(monthScore),
                allTime: allTimeMomentum,
            },
            tier: {
                thisMonth: {
                    key: monthTier.key,
                    label: monthTier.label,
                    emoji: monthTier.emoji,
                    color: monthTier.color,
                    progress: getTierProgress(monthScore),
                    pointsToNext: getPointsToNextTier(monthScore),
                },
                allTime: {
                    key: allTimeTier.key,
                    label: allTimeTier.label,
                    emoji: allTimeTier.emoji,
                    color: allTimeTier.color,
                    progress: getTierProgress(allTimeMomentum),
                    pointsToNext: getPointsToNextTier(allTimeMomentum),
                },
            },
            badges,
            metrics: {
                studyMinutes:       score?.studyMinutes ?? 0,
                cardsReviewed:      score?.cardsReviewed ?? 0,
                accuracyRate:       score?.accuracyRate ?? 0,
                modulesCreated:     score?.modulesCreated ?? 0,
                journeyCompletions: score?.journeyCompletions ?? 0,
                activeDays:         score?.activeDays ?? 0,
                contentAdoption:    score?.contentAdoption ?? 0,
            },
            period: period.toISOString().slice(0, 7),
            calculatedAt: score?.calculatedAt ?? null,
        });
    } catch (error) {
        console.error("[GET /api/scores/me]", error);
        const defaultTier = getTierForScore(0);
        return NextResponse.json({
            momentum: { thisMonth: 0, allTime: 0 },
            tier: {
                thisMonth: {
                    key: defaultTier.key,
                    label: defaultTier.label,
                    emoji: defaultTier.emoji,
                    color: defaultTier.color,
                    progress: 0,
                    pointsToNext: 100,
                },
                allTime: {
                    key: defaultTier.key,
                    label: defaultTier.label,
                    emoji: defaultTier.emoji,
                    color: defaultTier.color,
                    progress: 0,
                    pointsToNext: 100,
                },
            },
            badges: [],
            metrics: {
                studyMinutes: 0,
                cardsReviewed: 0,
                accuracyRate: 0,
                modulesCreated: 0,
                journeyCompletions: 0,
                activeDays: 0,
                contentAdoption: 0,
            },
            period: new Date().toISOString().slice(0, 7),
            calculatedAt: null,
        });
    }
}
