import { auth } from "@/auth";
import { calculateMomentum, saveAndRecalculate } from "@/lib/scoring/engine";
import { getTierForScore, getTierProgress, getPointsToNextTier } from "@/lib/scoring/tiers";
import { getBadgeDetails } from "@/lib/scoring/badges";
import { periodStart } from "@/lib/scoring/signals";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/scores/me
 * Kullanıcının güncel Momentum skoru, tier, rozetler ve görünür metrikler.
 * Gizli sinyal ağırlıkları asla dönmez.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        // Bu ay için skor hesapla (DB'den cache'li değer varsa kullan)
        const period = periodStart();
        const cached = await prisma.userScore.findUnique({
            where: { userId_period: { userId, period } },
        });

        // Cache 4 saatten eskiyse veya hiç yoksa yeniden hesapla
        const needsRecalc =
            !cached ||
            !cached.calculatedAt ||
            Date.now() - cached.calculatedAt.getTime() > 4 * 60 * 60 * 1000;

        let score = cached;
        if (needsRecalc) {
            await saveAndRecalculate(userId, period);
            score = await prisma.userScore.findUnique({
                where: { userId_period: { userId, period } },
            });
        }

        // Tüm zamanlar kümülatif skor
        const allTimeAgg = await prisma.userScore.aggregate({
            where: { userId },
            _sum: { finalScore: true },
        });
        const allTimeMomentum = Math.round(allTimeAgg._sum.finalScore ?? 0);
        const allTimeTier = getTierForScore(allTimeMomentum);

        // Bu aydaki tier
        const monthScore = score?.finalScore ?? 0;
        const monthTier = getTierForScore(monthScore);

        // Rozetler (engine'dan gelen badge key'leri → detay)
        const result = needsRecalc
            ? await calculateMomentum(userId, period)
            : null;
        const badgeKeys = result?.earnedBadges ?? [];
        const badges = getBadgeDetails(badgeKeys);

        return NextResponse.json({
            // Momentum skoru
            momentum: {
                thisMonth: Math.round(monthScore),
                allTime: allTimeMomentum,
            },

            // Tier bilgisi
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

            // Rozetler
            badges,

            // Görünür metrikler (gizli ağırlıklar yok)
            metrics: {
                studyMinutes:       score?.studyMinutes ?? 0,
                cardsReviewed:      score?.cardsReviewed ?? 0,
                accuracyRate:       score?.accuracyRate ?? 0,
                modulesCreated:     score?.modulesCreated ?? 0,
                journeyCompletions: score?.journeyCompletions ?? 0,
                activeDays:         score?.activeDays ?? 0,
                contentAdoption:    score?.contentAdoption ?? 0,
            },

            // Meta
            period: period.toISOString().slice(0, 7), // "2026-06"
            calculatedAt: score?.calculatedAt ?? null,
        });
    } catch (error) {
        console.error("[GET /api/scores/me]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
