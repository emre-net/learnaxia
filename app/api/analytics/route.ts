import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const totalDuration = await prisma.itemSession.aggregate({
            _sum: { durationMs: true },
            where: { userId }
        });

        // 1.1 Global Accuracy & Total Items Solved
        const globalProgress = await prisma.itemProgress.aggregate({
            _sum: {
                correctCount: true,
                wrongCount: true,
            },
            where: { userId }
        });

        const totalCorrect = globalProgress._sum.correctCount || 0;
        const totalWrong = globalProgress._sum.wrongCount || 0;
        const totalSolved = totalCorrect + totalWrong;
        const globalAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

        // 2. Daily Activity (Last 30 days)
        const lastMonthSessions = await prisma.itemSession.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true,
                durationMs: true
            }
        });

        const activityMap = new Map<string, number>();
        lastMonthSessions.forEach(s => {
            const date = s.createdAt.toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + (s.durationMs || 0));
        });

        const dailyActivity = Array.from(activityMap.entries()).map(([date, durationMs]) => ({
            date,
            duration: Math.round(durationMs / 60000) // Milliseconds → Minutes
        })).sort((a, b) => a.date.localeCompare(b.date));


        // 3. Module Performance — single grouped query (Fix #9: N+1)
        const activeModules = await prisma.userModuleLibrary.findMany({
            where: { userId },
            orderBy: { lastInteractionAt: 'desc' },
            take: 5,
            include: {
                module: {
                    select: { id: true, title: true }
                }
            }
        });

        const moduleIds = activeModules.map(m => m.moduleId);

        // Single query instead of N+1 loop
        const allProgress = moduleIds.length > 0
            ? await prisma.itemProgress.findMany({
                where: {
                    userId,
                    item: { moduleId: { in: moduleIds } }
                },
                select: {
                    correctCount: true,
                    wrongCount: true,
                    item: { select: { moduleId: true } }
                }
            })
            : [];

        // Group by moduleId in JS
        const moduleStatsMap = new Map<string, { correct: number; wrong: number }>();
        allProgress.forEach(p => {
            const mid = p.item.moduleId;
            const existing = moduleStatsMap.get(mid) || { correct: 0, wrong: 0 };
            existing.correct += p.correctCount;
            existing.wrong += p.wrongCount;
            moduleStatsMap.set(mid, existing);
        });

        const moduleStats = activeModules.map(entry => {
            const stats = moduleStatsMap.get(entry.moduleId) || { correct: 0, wrong: 0 };
            const total = stats.correct + stats.wrong;
            const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
            return {
                title: entry.module.title,
                accuracy,
                totalInteractions: total
            };
        });


        return NextResponse.json({
            stats: {
                totalStudyMinutes: Math.round((totalDuration._sum.durationMs || 0) / 60000),
                modulesStarted: activeModules.length,
                totalSolved,
                globalAccuracy,
            },
            dailyActivity,
            moduleStats
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
