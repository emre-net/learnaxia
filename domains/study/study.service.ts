import prisma from "@/lib/prisma";
import { ItemType, StudyMode } from "@/lib/types";

export class StudyService {
    static async startSession(userId: string, moduleId: string, mode: StudyMode) {
        // 1. Fetch Module & Items First
        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!module) throw new Error("Module not found");

        // 2. Permissive Access Check
        // Rule: Access allowed if Public OR Owner OR Linked Access (Private but has valid ID)
        // Since we are fetching by unique ID here, having the ID is proof of linked access.
        const isPublic = (module as any).visibility === 'PUBLIC';
        const isOwner = module.ownerId === userId;
        const isPrivateLinked = (module as any).visibility === 'PRIVATE';

        let hasAccess = isPublic || isOwner || isPrivateLinked;

        if (!hasAccess) {
            throw new Error("Unauthorized Study Access");
        }

        // 3. Fetch User Progress (Parallel)
        const [itemProgresses, sm2Progresses] = await Promise.all([
            prisma.itemProgress.findMany({
                where: { userId, itemId: { in: module.items.map((i: any) => i.id) } }
            }),
            prisma.sM2Progress.findMany({
                where: { userId, itemId: { in: module.items.map((i: any) => i.id) } }
            })
        ]);

        // 4. Merge & Filter Logic
        let items = module.items.map((item: any) => {
            const progress = itemProgresses.find((p: any) => p.itemId === item.id);
            const sm2 = sm2Progresses.find((p: any) => p.itemId === item.id);

            // Normalize Type & Content
            let type: any = item.type;
            let content: any = { ...item.content as object };

            if (type === 'MULTIPLE_CHOICE') type = 'MC';
            if (type === 'GAP_FILL') type = 'GAP';
            if (type === 'MC' || type === 'FLASHCARD' || type === 'TRUE_FALSE') {
                if (!content.question && content.front) content.question = content.front;
                if (!content.front && content.question) content.front = content.question;
                if (!content.answer && content.back) content.answer = content.back;
                if (!content.back && content.answer) content.back = content.answer;
            }

            if (type === 'TRUE_FALSE') {
                type = 'MC'; // Render TF as Multiple Choice (Quiz)
                if (!content.question && content.statement) {
                    content.question = content.statement;
                }
                // Ensure options exist for TF
                if (!content.options || content.options.length === 0) {
                    content.options = ["True", "False"];
                }
            }

            return {
                id: item.id,
                moduleId: item.moduleId,
                type: type,
                content: content,
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
            // Handbook Rule: "Item changed -> no longer wrong".
            // Filter: lastResult == WRONG AND item.hash == progress.hash
            items = items.filter((i: any) => {
                const progress = itemProgresses.find((p: any) => p.itemId === i.id);
                return i.lastResult === 'WRONG' && progress?.contentHash === i.hash;
            });
        } else if (mode === 'SM2') {
            // SM-2 Filter: Due items only (or new)
            // Due: nextReviewAt <= NOW
            const now = new Date();
            items = items.filter(i => {
                if (!i.nextReviewAt) return true; // New items are due
                return new Date(i.nextReviewAt) <= now;
            });
        } else if (mode === 'AI_SMART') {
            // Smart Order: Prioritize WRONG > New > Review
            items = items.sort((a: any, b: any) => {
                const scoreA = (a.lastResult === 'WRONG' ? 100 : 0) + (a.interval === 0 ? 50 : 0);
                const scoreB = (b.lastResult === 'WRONG' ? 100 : 0) + (b.interval === 0 ? 50 : 0);
                return scoreB - scoreA;
            });
        }




        // 6. Find Resumption Index (Improved)
        // Find the index of the first item that doesn't have a CORRECT progress
        const firstUnsolvedIndex = module.items.findIndex((item: any) => {
            const progress = itemProgresses.find((p: any) => p.itemId === item.id);
            return !progress || progress.lastResult !== 'CORRECT';
        });

        // 7. Create Session Log
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
            mode,
            resumedFromIndex: firstUnsolvedIndex >= 0 ? firstUnsolvedIndex : 0
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
