import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getTierForScore } from "@/lib/scoring/tiers";
import { periodStart } from "@/lib/scoring/signals";
import { NextResponse } from "next/server";

type Period = 'weekly' | 'monthly' | '3month' | 'alltime';

function getPeriodFilter(period: Period): { gte: Date } | undefined {
    const now = new Date();
    switch (period) {
        case 'weekly':
            // Bu haftanın Pazartesi'si
            const day = now.getUTCDay();
            const diff = (day === 0 ? 6 : day - 1);
            const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
            return { gte: monday };
        case 'monthly':
            return { gte: periodStart() };
        case '3month':
            return { gte: new Date(Date.now() - 90 * 86_400_000) };
        case 'alltime':
        default:
            return undefined;
    }
}

/**
 * GET /api/leaderboard?period=weekly|monthly|3month|alltime&tier=all|bronze|...&limit=50
 * Liderboard — dönem + tier filtrelemeli, kullanıcı sıralamasıyla.
 * Gizlilik: Profili gizli olan kullanıcılar görünmez ama sıralama hesaba katılır.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = (searchParams.get('period') ?? 'monthly') as Period;
        const tierFilter = searchParams.get('tier') ?? 'all';
        const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

        const periodFilter = getPeriodFilter(period);

        // Kullanıcı bazında dönem skorlarını topla
        const scores = await prisma.userScore.groupBy({
            by: ['userId'],
            where: {
                ...(periodFilter ? { period: periodFilter } : {}),
                ...(tierFilter !== 'all' ? { tier: tierFilter } : {}),
            },
            _sum: { finalScore: true },
            orderBy: { _sum: { finalScore: 'desc' } },
            take: limit + 1, // +1: kullanıcı ilk 50'de değilse bile sırasını bul
        });

        // Kullanıcı bilgilerini çek (sadece public profiller)
        const userIds = scores.map(s => s.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                handle: true,
                image: true,
                settings: true,
            },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        // Sıralama oluştur
        let rank = 0;
        const entries = scores
            .slice(0, limit)
            .map(s => {
                rank++;
                const user = userMap.get(s.userId);
                if (!user) return null;

                const settings = (user.settings as any) ?? {};
                // Kullanıcı gizlilik modundaysa sadece puan + tier göster
                const isPrivate = settings.profilePrivate === true;

                const finalScore = Math.round(s._sum.finalScore ?? 0);
                const tier = getTierForScore(finalScore);

                return {
                    rank,
                    userId: user.id,
                    name: isPrivate ? null : (user.name ?? 'Kullanıcı'),
                    handle: isPrivate ? null : user.handle,
                    image: isPrivate ? null : user.image,
                    momentum: finalScore,
                    tier: {
                        key: tier.key,
                        label: tier.label,
                        emoji: tier.emoji,
                        color: tier.color,
                    },
                    isCurrentUser: user.id === session.user?.id,
                };
            })
            .filter(Boolean);

        // Mevcut kullanıcının kendi sıralaması (ilk 50'de yoksa)
        const myRankInList = entries.findIndex(e => e?.userId === session.user?.id);
        let myEntry = null;
        if (myRankInList === -1) {
            // Kullanıcı listede yok — kendi sırasını bul
            const myTotalRank = await prisma.userScore.groupBy({
                by: ['userId'],
                where: periodFilter ? { period: periodFilter } : {},
                _sum: { finalScore: true },
                having: { finalScore: { _sum: { gt: 0 } } },
            });
            const sorted = myTotalRank.sort((a, b) =>
                (b._sum.finalScore ?? 0) - (a._sum.finalScore ?? 0)
            );
            const myIdx = sorted.findIndex(s => s.userId === session.user?.id);
            if (myIdx !== -1) {
                const myScore = Math.round(sorted[myIdx]._sum.finalScore ?? 0);
                const myTier = getTierForScore(myScore);
                myEntry = {
                    rank: myIdx + 1,
                    userId: session.user.id,
                    name: session.user.name ?? null,
                    handle: null,
                    image: session.user.image ?? null,
                    momentum: myScore,
                    tier: { key: myTier.key, label: myTier.label, emoji: myTier.emoji, color: myTier.color },
                    isCurrentUser: true,
                };
            }
        }

        return NextResponse.json({
            period,
            entries,
            myEntry,   // null ise zaten listede
            total: scores.length,
        });
    } catch (error) {
        console.error("[GET /api/leaderboard]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
