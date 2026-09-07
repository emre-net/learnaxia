import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function POST(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // 1. Fetch all due cards for the user across all modules
        const dueProgressRecords = await prisma.sM2Progress.findMany({
            where: {
                userId: user.id,
                nextReviewAt: { lte: now },
                isRetired: false
            },
            include: {
                item: true
            },
            orderBy: {
                nextReviewAt: 'asc' // Oldest reviews first
            },
            take: 100 // Cap session at 100 cards maximum per daily burst
        });

        if (dueProgressRecords.length === 0) {
            return NextResponse.json({ error: "Bugün için tekrar edilecek kart yok." }, { status: 404 });
        }

        const items = dueProgressRecords.map(p => p.item);

        const firstModuleId = items[0].moduleId;

        const learningSession = await prisma.learningSession.create({
            data: {
                userId: user.id,
                moduleId: firstModuleId,
                startedAt: new Date()
            }
        });

        // Format Items
        const formattedItems = items.map(item => {
            const content = item.content as any;
            return {
                id: item.id,
                type: item.type,
                moduleId: item.moduleId,
                content: {
                    ...content
                }
            };
        });

        return NextResponse.json({
            sessionId: learningSession.id,
            items: formattedItems,
            resumedFromIndex: 0
        });

    } catch (error) {
        console.error("[MOBILE_START_DAILY_SESSION_ERROR]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
