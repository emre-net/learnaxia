
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- Validation Schemas ---

const GuestItemProgressSchema = z.object({
    itemId: z.string(),
    moduleId: z.string(),
    contentHash: z.string(),
    correctCount: z.number().int().nonnegative(),
    wrongCount: z.number().int().nonnegative(),
    lastResult: z.enum(['CORRECT', 'WRONG', 'HINT', 'SKIP']).nullable(),
    lastReviewedAt: z.string().datetime(),
});

const GuestItemSessionSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    itemId: z.string(),
    result: z.string(),
    durationMs: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
});

const GuestLearningSessionSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    durationMs: z.number().int().nonnegative(),
    mode: z.enum(['NORMAL', 'REVIEW', 'WRONG_ONLY', 'SM2']),
});

const MergeRequestSchema = z.object({
    guestData: z.object({
        progress: z.array(GuestItemProgressSchema),
        sessions: z.array(GuestLearningSessionSchema),
        itemSessions: z.array(GuestItemSessionSchema).optional(),
    }),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { guestData } = MergeRequestSchema.parse(body);
        const userId = session.user.id;

        // Fix #11: Wrap ALL merge operations in a single transaction
        const results = await prisma.$transaction(async (tx: any) => {
            const counts = { merged: 0, skipped: 0, sessions: 0, itemSessions: 0 };

            // --- 1. Merge Progress ---
            for (const local of guestData.progress) {
                const serverProgress = await tx.itemProgress.findUnique({
                    where: {
                        userId_itemId: { userId, itemId: local.itemId },
                    },
                });

                let shouldUpdate = false;

                if (!serverProgress) {
                    shouldUpdate = true;
                } else {
                    const localAttempts = local.correctCount + local.wrongCount;
                    const serverAttempts = serverProgress.correctCount + serverProgress.wrongCount;
                    const localAccuracy = localAttempts > 0 ? local.correctCount / localAttempts : 0;
                    const serverAccuracy = serverAttempts > 0 ? serverProgress.correctCount / serverAttempts : 0;

                    if (localAccuracy > serverAccuracy) {
                        shouldUpdate = true;
                    } else if (localAccuracy === serverAccuracy) {
                        if (localAttempts > serverAttempts) {
                            shouldUpdate = true;
                        } else if (localAttempts === serverAttempts) {
                            if (new Date(local.lastReviewedAt) > serverProgress.lastReviewedAt) {
                                shouldUpdate = true;
                            }
                        }
                    }
                }

                if (shouldUpdate) {
                    await tx.itemProgress.upsert({
                        where: {
                            userId_itemId: { userId, itemId: local.itemId },
                        },
                        update: {
                            correctCount: local.correctCount,
                            wrongCount: local.wrongCount,
                            lastResult: local.lastResult || undefined,
                            contentHash: local.contentHash,
                            lastReviewedAt: local.lastReviewedAt,
                            strengthScore: local.correctCount > local.wrongCount ? 0.8 : 0.2,
                        },
                        create: {
                            userId,
                            itemId: local.itemId,
                            correctCount: local.correctCount,
                            wrongCount: local.wrongCount,
                            lastResult: local.lastResult || undefined,
                            contentHash: local.contentHash,
                            lastReviewedAt: local.lastReviewedAt,
                            strengthScore: local.correctCount > local.wrongCount ? 0.8 : 0.2,
                        },
                    });
                    counts.merged++;
                } else {
                    counts.skipped++;
                }
            }

            // --- 2. Merge Sessions ---
            for (const s of guestData.sessions) {
                const existingSession = await tx.learningSession.findUnique({
                    where: { id: s.id }
                });

                if (!existingSession) {
                    await tx.learningSession.create({
                        data: {
                            id: s.id,
                            userId,
                            moduleId: s.moduleId,
                            startedAt: s.startedAt,
                        }
                    });
                    counts.sessions++;
                }
            }

            // --- 3. Merge Item Sessions ---
            if (guestData.itemSessions) {
                for (const log of guestData.itemSessions) {
                    const existingLog = await tx.itemSession.findUnique({
                        where: { id: log.id }
                    });

                    if (!existingLog) {
                        const parentSession = await tx.learningSession.findUnique({ where: { id: log.sessionId } });
                        if (parentSession) {
                            await tx.itemSession.create({
                                data: {
                                    id: log.id,
                                    sessionId: log.sessionId,
                                    userId,
                                    itemId: log.itemId,
                                    result: log.result,
                                    durationMs: log.durationMs,
                                    createdAt: log.createdAt
                                }
                            });
                            counts.itemSessions++;
                        }
                    }
                }
            }

            return counts;
        });

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Merge error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
