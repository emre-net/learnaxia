import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Find all due items for this user
        const dueItems = await prisma.sM2Progress.findMany({
            where: {
                userId: session.user.id,
                nextReviewAt: { lte: now },
                isRetired: false
            },
            include: {
                item: {
                    include: {
                        module: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });

        const totalDue = dueItems.length;

        // Group by moduleId
        const groupedByModule = dueItems.reduce((acc, progress) => {
            const moduleId = progress.item.moduleId;
            const moduleData = progress.item.module;

            if (!moduleId || !moduleData) return acc;

            if (!acc[moduleId]) {
                acc[moduleId] = {
                    module: {
                        id: moduleData.id,
                        title: moduleData.title,
                        description: moduleData.description,
                        category: moduleData.category
                    },
                    dueCount: 0,
                    itemIds: []
                };
            }

            acc[moduleId].dueCount += 1;
            acc[moduleId].itemIds.push(progress.itemId);
            return acc;
        }, {} as Record<string, any>);

        // Convert grouped object to array
        const modulesWithDueCards = Object.values(groupedByModule).sort((a: any, b: any) => b.dueCount - a.dueCount);

        return NextResponse.json({
            totalDue,
            modules: modulesWithDueCards
        });

    } catch (error) {
        console.error("[DAILY_QUEUE_GET] ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
