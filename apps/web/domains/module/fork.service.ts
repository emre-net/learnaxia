
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createHash } from 'crypto';

function computeContentHash(content: unknown): string {
    const normalized = JSON.stringify(content, Object.keys(content as object).sort());
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export class ForkService {
    /**
     * Forks (Deep Copies) a module for the current user.
     */
    static async fork(userId: string, sourceModuleId: string) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Fetch Source Module with Items
            const sourceModule = await tx.module.findUnique({
                where: { id: sourceModuleId },
                include: { items: { orderBy: { order: 'asc' } } }
            });

            if (!sourceModule) throw new Error("Module not found");
            if (!sourceModule.isForkable) throw new Error("This module cannot be forked");

            // 2. Clone Module
            const newModule = await tx.module.create({
                data: {
                    title: sourceModule.title,
                    description: sourceModule.description,
                    type: sourceModule.type,
                    status: 'ACTIVE',
                    isForkable: true,
                    ownerId: userId,
                    creatorId: userId,
                    sourceModuleId: sourceModule.id,
                    category: sourceModule.category,
                    subCategory: sourceModule.subCategory,
                }
            });

            if (sourceModule.items.length > 0) {
                // 3. Create Items in Bulk
                await tx.item.createMany({
                    data: sourceModule.items.map(item => ({
                        moduleId: newModule.id,
                        type: item.type,
                        content: item.content as Prisma.InputJsonValue,
                        contentHash: item.contentHash,
                        order: item.order,
                        sourceItemId: item.id
                    }))
                });

                // 4. Copy Progress
                const newItems = await tx.item.findMany({
                    where: { moduleId: newModule.id },
                    orderBy: { order: 'asc' }
                });

                const sourceItemIds = sourceModule.items.map(i => i.id);
                const existingProgress = await tx.itemProgress.findMany({
                    where: { userId, itemId: { in: sourceItemIds } }
                });
                const existingSM2 = await tx.sM2Progress.findMany({
                    where: { userId, itemId: { in: sourceItemIds } }
                });

                const progressMap = new Map(existingProgress.map(p => [p.itemId, p]));
                const sm2Map = new Map(existingSM2.map(p => [p.itemId, p]));

                const progressToCreate: any[] = [];
                const sm2ToCreate: any[] = [];

                newItems.forEach((newItem, index) => {
                    const sourceItem = sourceModule.items[index];
                    const srcProgress = progressMap.get(sourceItem.id);

                    if (srcProgress && srcProgress.contentHash === newItem.contentHash) {
                        progressToCreate.push({
                            userId,
                            itemId: newItem.id,
                            contentHash: newItem.contentHash,
                            correctCount: srcProgress.correctCount,
                            wrongCount: srcProgress.wrongCount,
                            strengthScore: srcProgress.strengthScore,
                            lastResult: srcProgress.lastResult,
                            lastReviewedAt: srcProgress.lastReviewedAt,
                            aiMetadata: srcProgress.aiMetadata ?? Prisma.JsonNull,
                        });

                        const srcSM2 = sm2Map.get(sourceItem.id);
                        if (srcSM2) {
                            sm2ToCreate.push({
                                userId,
                                itemId: newItem.id,
                                repetition: srcSM2.repetition,
                                interval: srcSM2.interval,
                                easeFactor: srcSM2.easeFactor,
                                nextReviewAt: srcSM2.nextReviewAt,
                                isRetired: srcSM2.isRetired
                            });
                        }
                    }
                });

                if (progressToCreate.length > 0) {
                    await tx.itemProgress.createMany({ data: progressToCreate });
                }
                if (sm2ToCreate.length > 0) {
                    await tx.sM2Progress.createMany({ data: sm2ToCreate });
                }
            }

            // 5. Add to User Library & Grant Access
            await tx.userModuleLibrary.create({
                data: {
                    userId: userId,
                    moduleId: newModule.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date(),
                }
            });

            await tx.userContentAccess.create({
                data: {
                    userId: userId,
                    resourceId: newModule.id,
                    resourceType: 'MODULE',
                    accessLevel: 'OWNER',
                }
            });

            return newModule;
        });
    }

    /**
     * Fork-on-Edit helper: Forks the module and returns the new item ID that corresponds to the source item.
     */
    static async forkAndApplyUpdate(userId: string, moduleId: string, itemId: string, itemData: any) {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Fork the module
            const newModule = await this.fork(userId, moduleId);

            // 2. Find the corresponding item in the new module
            const newItem = await tx.item.findFirst({
                where: { moduleId: newModule.id, sourceItemId: itemId }
            });

            if (!newItem) throw new Error("Mapped item not found in fork");

            // 3. Update the new item
            const updatedItem = await tx.item.update({
                where: { id: newItem.id },
                data: {
                    content: itemData.content as Prisma.InputJsonValue,
                    contentHash: computeContentHash(itemData.content),
                    type: itemData.type,
                }
            });

            return { module: newModule, item: updatedItem };
        });
    }
}
