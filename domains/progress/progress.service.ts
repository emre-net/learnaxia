import prisma from "@/lib/prisma";
import { calculateSM2, SM2Input, SM2_CONFIG } from "@/lib/sm2";
import { ItemType } from "@/lib/types";

export class ProgressService {

    /**
     * Records a study result for a single item.
     * Handles:
     * 1. Log creation (ItemSession)
     * 2. Progress update (ItemProgress)
     * 3. SM-2 calculation & update (SM2Progress) - if Flashcard
     */
    static async recordItemResult(
        userId: string,
        sessionId: string,
        itemId: string,
        data: {
            quality: number; // 0-5
            durationMs: number;
        }
    ) {
        return await prisma.$transaction(async (tx) => {
            // 1. Validate Session & Ownership
            const session = await tx.learningSession.findUnique({
                where: { id: sessionId }
            });
            if (!session) throw new Error("Session not found");
            if (session.userId !== userId) throw new Error("Unauthorized Session Access");

            // 2. Fetch Item & Verify Module Consistency
            const item = await tx.item.findUnique({ where: { id: itemId } });
            if (!item) throw new Error("Item not found");
            if (item.moduleId !== session.moduleId) throw new Error("Item does not belong to this session");

            const prevProgress = await tx.itemProgress.findUnique({
                where: { userId_itemId: { userId, itemId } }
            });

            const prevSM2 = await tx.sM2Progress.findUnique({
                where: { userId_itemId: { userId, itemId } }
            });

            // 2. Log Session (Analytics)
            await tx.itemSession.create({
                data: {
                    sessionId,
                    userId,
                    itemId,
                    result: data.quality >= 3 ? 'CORRECT' : 'WRONG',
                    durationMs: data.durationMs,
                }
            });

            // 3. Update General Progress
            const isCorrect = data.quality >= 3;
            await tx.itemProgress.upsert({
                where: { userId_itemId: { userId, itemId } },
                create: {
                    userId,
                    itemId,
                    contentHash: item.contentHash,
                    correctCount: isCorrect ? 1 : 0,
                    wrongCount: isCorrect ? 0 : 1,
                    lastResult: isCorrect ? 'CORRECT' : 'WRONG',
                    strengthScore: isCorrect ? 0.1 : 0, // Simple start
                    lastReviewedAt: new Date()
                },
                update: {
                    correctCount: { increment: isCorrect ? 1 : 0 },
                    wrongCount: { increment: isCorrect ? 0 : 1 },
                    lastResult: isCorrect ? 'CORRECT' : 'WRONG',
                    contentHash: item.contentHash,
                    lastReviewedAt: new Date(),
                    // Strength score logic would go here (simplified for now)
                }
            });

            // 4. SM-2 Calculation (Only for Flashcards)
            if (item.type === 'FLASHCARD') {
                const input: SM2Input = {
                    quality: data.quality,
                    lastInterval: prevSM2?.interval ?? SM2_CONFIG.initialInterval,
                    lastEase: prevSM2?.easeFactor ?? SM2_CONFIG.initialEase,
                    repetition: prevSM2?.repetition ?? 0
                };

                const output = calculateSM2(input);

                await tx.sM2Progress.upsert({
                    where: { userId_itemId: { userId, itemId } },
                    create: {
                        userId,
                        itemId,
                        interval: output.nextInterval,
                        easeFactor: output.nextEase,
                        repetition: output.repetition,
                        nextReviewAt: output.nextReviewDate,
                        isRetired: output.isRetired
                    },
                    update: {
                        interval: output.nextInterval,
                        easeFactor: output.nextEase,
                        repetition: output.repetition,
                        nextReviewAt: output.nextReviewDate,
                        isRetired: output.isRetired
                    }
                });

                return output;
            }

            return null;
        });
    }
}
