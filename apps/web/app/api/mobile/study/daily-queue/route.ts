import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/auth/mobile-jwt";

/**
 * Returns the list of modules that have items due for SM2 review today.
 */
export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Find all progress items that are due
        const dueProgress = await prisma.sM2Progress.findMany({
            where: {
                userId: user.id,
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

        // Group by module
        const moduleMap = new Map<string, any>();
        let totalDue = 0;

        dueProgress.forEach(p => {
            const module = p.item.module;
            if (!moduleMap.has(module.id)) {
                moduleMap.set(module.id, {
                    module: {
                        id: module.id,
                        title: module.title,
                        description: module.description,
                        category: module.category
                    },
                    dueCount: 0,
                    itemIds: []
                });
            }

            const entry = moduleMap.get(module.id);
            entry.dueCount++;
            entry.itemIds.push(p.itemId);
            totalDue++;
        });

        return NextResponse.json({
            totalDue,
            modules: Array.from(moduleMap.values())
        });

    } catch (error) {
        console.error("[Daily Queue] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
