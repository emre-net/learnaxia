import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // 1. Fetch all due cards for the user across all modules
        const dueProgressRecords = await prisma.sM2Progress.findMany({
            where: {
                userId: session.user.id,
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
            return NextResponse.json({ error: "No reviews due today." }, { status: 404 });
        }

        const items = dueProgressRecords.map(p => p.item);

        // 2. We don't have a single moduleId for the traditional ItemSession tracking, 
        // so we can dynamically log it under a "Daily Review" pseudo-module logic or bypass traditional 
        // LearningSession logging, keeping only the SM2Progress atomic logs going forward via /api/study/log.
        // For compatibility with the StudyStore, we will create a dummy LearningSession hooked to the chronologically first due module just for the trace ID.

        const firstModuleId = items[0].moduleId;

        const learningSession = await prisma.learningSession.create({
            data: {
                userId: session.user.id,
                moduleId: firstModuleId,
                startedAt: new Date()
            }
        });

        // 3. Format Items to match the expected AIResponseItem/UI type format
        const formattedItems = items.map(item => {
            const content = item.content as any;
            return {
                id: item.id,
                type: item.type,
                moduleId: item.moduleId, // Ensure the UI knows where the card came from
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
        console.error("[START_DAILY_SESSION_ERROR]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
