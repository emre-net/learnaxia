import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const totalDuration = await prisma.itemSession.aggregate({
            _sum: { durationMs: true },
            where: { userId }
        });

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
        lastMonthSessions.forEach((s: any) => {
            const date = s.createdAt.toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + (s.durationMs || 0));
        });

        const dailyActivity = Array.from(activityMap.entries()).map(([date, durationMs]) => ({
            date,
            duration: Math.round(durationMs / 60000)
        })).sort((a, b) => a.date.localeCompare(b.date));

        const allLibraryEntries = await prisma.userModuleLibrary.findMany({
            where: { userId },
            include: {
                module: {
                    select: { id: true, title: true }
                }
            }
        });

        const activeModulesCount = allLibraryEntries.length;
        const recentModules = allLibraryEntries
            .sort((a: any, b: any) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime())
            .slice(0, 5);

        const moduleIds = recentModules.map((m: any) => m.moduleId);

        const recentProgress = moduleIds.length > 0
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

        const moduleStatsMap = new Map<string, { correct: number; wrong: number }>();
        recentProgress.forEach((p: any) => {
            const mid = p.item.moduleId;
            const existing = moduleStatsMap.get(mid) || { correct: 0, wrong: 0 };
            existing.correct += p.correctCount;
            existing.wrong += p.wrongCount;
            moduleStatsMap.set(mid, existing);
        });

        const moduleStats = recentModules.map((entry: any) => {
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
                modulesStarted: activeModulesCount,
                totalSolved,
                averageAccuracy: globalAccuracy
            },
            dailyActivity,
            moduleStats
        });

    } catch (error) {
        console.error("Mobile Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
