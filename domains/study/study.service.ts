import prisma from "@/lib/prisma";
import { SM2_CONFIG } from "@/lib/sm2";

export type StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW';

export class StudyService {
    static async startSession(userId: string, moduleId: string, mode: StudyMode) {
        // 1. Check Access
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access) {
            throw new Error("Unauthorized Study Access");
        }

        // 2. Fetch Module & Items
        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!module) throw new Error("Module not found");

        // 3. Fetch User Progress (Parallel)
        const [itemProgresses, sm2Progresses] = await Promise.all([
            prisma.itemProgress.findMany({
                where: { userId, itemId: { in: module.items.map(i => i.id) } }
            }),
            prisma.sM2Progress.findMany({
                where: { userId, itemId: { in: module.items.map(i => i.id) } }
            })
        ]);

        // 4. Merge & Filter Logic
        let items = module.items.map(item => {
            const progress = itemProgresses.find(p => p.itemId === item.id);
            const sm2 = sm2Progresses.find(p => p.itemId === item.id);

            return {
                id: item.id,
                moduleId: item.moduleId,
                type: item.type,
                content: item.content,
                hash: item.contentHash,
                // Progress Data
                lastResult: progress?.lastResult,
                strengthScore: progress?.strengthScore ?? 0,
                // SM2 Data
                box: _calculateBox(sm2?.interval), // Visual representation
                interval: sm2?.interval ?? 0,
                nextReviewAt: sm2?.nextReviewAt,
                isRetired: sm2?.isRetired ?? false
            };
        });

        // 5. Apply Mode Filters
        if (mode === 'WRONG_ONLY') {
            items = items.filter(i => i.lastResult === 'WRONG');
        } else if (mode === 'SM2') {
            // SM-2 Filter: Due items only (or new)
            // Due: nextReviewAt <= NOW
            const now = new Date();
            items = items.filter(i => {
                if (!i.nextReviewAt) return true; // New items are due
                return new Date(i.nextReviewAt) <= now;
            });
        }

        // 6. Create Session Log
        const session = await prisma.learningSession.create({
            data: {
                userId,
                moduleId,
                startedAt: new Date()
            }
        });

        return {
            sessionId: session.id,
            module: {
                id: module.id,
                title: module.title,
                type: module.type
            },
            items,
            mode
        };
    }
}

// Helper to estimate a "box" number (Leitner style) from SM-2 interval for UI
function _calculateBox(interval?: number): number {
    if (!interval || interval <= 1) return 1;
    if (interval <= 3) return 2;
    if (interval <= 7) return 3;
    if (interval <= 21) return 4;
    return 5;
}
