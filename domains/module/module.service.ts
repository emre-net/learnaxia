
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createHash } from 'crypto';

/**
 * Computes a deterministic content hash for an item.
 * Used for duplicate detection and merge conflict resolution.
 */
function computeContentHash(content: unknown): string {
    const normalized = JSON.stringify(content, Object.keys(content as object).sort());
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

// Types
export type CreateModuleDto = {
    title: string;
    description?: string;
    type: 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';
    isForkable?: boolean;
    status?: 'DRAFT' | 'ACTIVE';
    items?: any[];
    category?: string;
    subCategory?: string;
};

export class ModuleService {
    /**
     * Creates a new module with transactional integrity.
     */
    static async create(userId: string, dto: CreateModuleDto) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Create Module
            const module = await tx.module.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    type: dto.type,
                    isForkable: dto.isForkable ?? true,
                    status: dto.status ?? 'DRAFT',
                    ownerId: userId,
                    creatorId: userId,
                    // Category & SubCategory are optional but should be passed if present
                    category: dto.category ?? null,
                    subCategory: dto.subCategory ?? null,
                },
            });

            // 2. Create Items (if any)
            if (dto.items && dto.items.length > 0) {
                const itemsData = dto.items.map((item, index) => ({
                    moduleId: module.id,
                    type: dto.type,
                    content: item as Prisma.InputJsonValue,
                    contentHash: computeContentHash(item),
                    order: index,
                }));

                await tx.item.createMany({
                    data: itemsData
                });
            }

            // 3. Add to User Library (Read Model)
            await tx.userModuleLibrary.create({
                data: {
                    userId: userId,
                    moduleId: module.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date(),
                },
            });

            // 4. Grant Access (Lock)
            await tx.userContentAccess.create({
                data: {
                    userId: userId,
                    resourceId: module.id,
                    resourceType: 'MODULE',
                    accessLevel: 'OWNER',
                },
            });

            return module;
        });
    }

    /**
     * Retrieves all modules in the user's library.
     * Includes modules created by the user and modules they have saved/forked.
     */
    static async getUserLibrary(userId: string) {
        console.log(`[ModuleService] Fetching inclusive library for user: ${userId}`);

        // 1. Get modules from the join table (standard library)
        const libraryEntries = await prisma.userModuleLibrary.findMany({
            where: { userId },
            include: {
                module: {
                    include: {
                        owner: { select: { id: true, handle: true, image: true } },
                        sourceModule: {
                            select: {
                                id: true,
                                title: true,
                                owner: { select: { handle: true, image: true } }
                            }
                        },
                        _count: { select: { items: true, userLibrary: { where: { role: 'SAVED' } }, forks: true, sessions: true } }
                    }
                }
            },
            orderBy: { lastInteractionAt: 'desc' }
        });

        // 2. RESCUE: Get modules where user is owner but NOT in join table
        const entryModuleIds = libraryEntries.map(e => e.moduleId);
        const ownedModules = await prisma.module.findMany({
            where: {
                ownerId: userId,
                id: { notIn: entryModuleIds }
            },
            include: {
                owner: { select: { id: true, handle: true, image: true } },
                sourceModule: {
                    select: {
                        id: true,
                        title: true,
                        owner: { select: { handle: true, image: true } }
                    }
                },
                _count: { select: { items: true } }
            }
        });

        if (ownedModules.length > 0) {
            console.log(`[ModuleService] Rescuing ${ownedModules.length} owned modules for user ${userId}. Adding to join table.`);

            // Approval Item 3: Ensure data integrity by creating missing library entries
            await prisma.userModuleLibrary.createMany({
                data: ownedModules.map(m => ({
                    userId,
                    moduleId: m.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date()
                })),
                skipDuplicates: true
            });
        }

        // 3. Normalization & Merge
        const standardResults = libraryEntries.map(e => ({
            ...e,
            solvedCount: 0
        }));

        const rescueResults = ownedModules.map(m => ({
            userId,
            moduleId: m.id,
            role: 'OWNER',
            lastInteractionAt: m.createdAt,
            module: m,
            solvedCount: 0
        }));

        const allItems = [...standardResults, ...rescueResults];

        // 4. Fetch solved counts for all items in a single query (Optimization)
        const moduleIds = allItems.map(item => item.moduleId);
        if (moduleIds.length === 0) return [];

        const progressStats = await prisma.itemProgress.groupBy({
            by: ['itemId'],
            where: {
                userId,
                lastResult: 'CORRECT',
                item: { moduleId: { in: moduleIds } }
            },
            _count: true
        });

        // We need to map itemId counts back to moduleIds
        // Since groupBy only groups by top-level fields in Prisma's current version for ItemProgress,
        // we'll fetch the mapping of item -> module for these items if needed, 
        // OR we can fetch ItemProgress joined with Item to group by ModuleId.

        // BETTER APPROACH: Use aggregate if groupBy moduleId is not directly possible via nested fields.
        // Actually, Prisma's groupBy for nested fields is limited. 
        // Let's use findMany with includes or a more direct query.

        const correctItems = await prisma.itemProgress.findMany({
            where: {
                userId,
                lastResult: 'CORRECT',
                item: { moduleId: { in: moduleIds } }
            },
            select: {
                item: { select: { moduleId: true } }
            }
        });

        const solvedMap: Record<string, number> = {};
        correctItems.forEach(p => {
            const mid = p.item.moduleId;
            solvedMap[mid] = (solvedMap[mid] || 0) + 1;
        });

        return allItems.map(item => ({
            ...item,
            solvedCount: solvedMap[item.moduleId] || 0
        })).sort((a: any, b: any) =>
            new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()
        );
    }

    /**
     * Retrieves public modules for Discovery.
     */
    static async getDiscoverModules(userId: string, search?: string) {
        return await prisma.module.findMany({
            where: {
                status: 'ACTIVE',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                visibility: 'PUBLIC' as any,
                NOT: { ownerId: userId },
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                owner: {
                    select: { handle: true, image: true }
                },
                _count: {
                    select: { items: true, userLibrary: { where: { role: 'SAVED' } }, forks: true, sessions: true }
                }
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Gets a single module detail.
     */
    static async getById(userId: string, moduleId: string) {
        // 1. Fetch Module basic info to check visibility
        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: { orderBy: { order: 'asc' } },
                owner: { select: { handle: true, image: true, id: true } },
                sourceModule: {
                    select: {
                        id: true,
                        title: true,
                        owner: { select: { handle: true } }
                    }
                }
            }
        });

        if (!module) throw new Error("Module not found");

        // 2. PERMISSIVE ACCESS RULES:
        // Rule A: Public Content is viewable by anyone
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((module as any).visibility === 'PUBLIC') {
            return module;
        }

        // Rule B: Owner has full access
        if (module.ownerId === userId) {
            return module;
        }

        // Rule C: Private but user has the Link (UUID security)
        // Since we are fetching by unique ID, having the ID is proof of sharing for PRIVATE modules.
        // We allow viewing/studying but NOT editing.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((module as any).visibility === 'PRIVATE') {
            return module;
        }

        throw new Error("Unauthorized Access");
    }

    /**
     * Updates module metadata.
     */
    static async update(userId: string, moduleId: string, dto: Partial<CreateModuleDto>) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Update Access");
        }

        await prisma.module.update({
            where: { id: moduleId },
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type,
                isForkable: dto.isForkable,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                visibility: (dto as any).visibility as any, // Accept visibility update
                status: dto.status,
                category: dto.category,
                subCategory: dto.subCategory,
            }
        });

        // Handle Items Synchronization if provided
        if (dto.items) {
            const items = dto.items; // Local variable for type narrowing
            await prisma.$transaction(async (tx) => {
                // 1. Fetch existing items to identify what to delete/update
                const existingItems = await tx.item.findMany({
                    where: { moduleId },
                    select: { id: true }
                });
                const existingItemIds = new Set(existingItems.map(i => i.id));

                // 2. Identify items to keep/update and items to create
                // Filter items that have an ID and that ID exists in DB
                const incomingItemIds = new Set(items.filter(i => i.id && existingItemIds.has(i.id)).map(i => i.id));

                // Items to create: No ID, or ID not in DB
                const itemsToCreate = items.filter(i => !i.id || !existingItemIds.has(i.id));

                // 3. Delete items that are no longer in the incoming list
                const itemsToDelete = existingItems.filter(i => !incomingItemIds.has(i.id)).map(i => i.id);
                if (itemsToDelete.length > 0) {
                    await tx.item.deleteMany({
                        where: { id: { in: itemsToDelete } }
                    });
                }

                // 4. Update existing items
                for (const item of items) {
                    if (item.id && existingItemIds.has(item.id)) {
                        await tx.item.update({
                            where: { id: item.id },
                            data: {
                                content: item.content as Prisma.InputJsonValue,
                                contentHash: computeContentHash(item.content),
                                order: item.order,
                                type: dto.type // Ensure type consistency
                            }
                        });
                    }
                }

                // 5. Create new items
                if (itemsToCreate.length > 0) {
                    // We need to handle order carefully. If we just append, it's easy.
                    // But the incoming list likely has the correct 'order' values already set by frontend.
                    await tx.item.createMany({
                        data: itemsToCreate.map(item => ({
                            moduleId: moduleId,
                            type: dto.type || 'FLASHCARD', // Fallback, though type should be set
                            content: item.content as Prisma.InputJsonValue,
                            contentHash: computeContentHash(item.content),
                            order: item.order
                        }))
                    });
                }
            });
        }

        return await prisma.module.findUnique({
            where: { id: moduleId },
            include: { items: { orderBy: { order: 'asc' } } }
        });
    }

    // Other methods remain largely unchanged, but keeping them here for completeness if needed
    // Assuming Archive/AddItem logic is standard.
    /**
     * Archives a module (Soft Delete according to Rule 115).
     */
    static async archive(userId: string, moduleId: string) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Archive Access");
        }

        return await prisma.module.update({
            where: { id: moduleId },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date()
            } as any
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async addItem(userId: string, moduleId: string, itemData: any) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || (access.accessLevel !== 'OWNER' && access.accessLevel !== 'EDITOR')) {
            throw new Error("Unauthorized Add Item Access");
        }

        const lastItem = await prisma.item.findFirst({
            where: { moduleId },
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastItem?.order ?? -1) + 1;

        return await prisma.item.create({
            data: {
                moduleId: moduleId,
                type: itemData.type,
                content: itemData.content as Prisma.InputJsonValue,
                contentHash: computeContentHash(itemData.content),
                order: newOrder
            }
        });
    }

    /**
     * Updates a single item.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async updateItem(userId: string, moduleId: string, itemId: string, itemData: any) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Update Item Access");
        }

        // Verify item belongs to module
        const existingItem = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!existingItem || existingItem.moduleId !== moduleId) {
            throw new Error("Item not found in this module");
        }

        return await prisma.item.update({
            where: { id: itemId },
            data: {
                content: itemData.content as Prisma.InputJsonValue,
                contentHash: computeContentHash(itemData.content),
                type: itemData.type,
                // Order is typically strictly managed via reorder endpoint, not here, but can be allowed.
            }
        });
    }

    /**
     * Deletes a single item.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async deleteItem(userId: string, moduleId: string, itemId: string) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Delete Item Access");
        }

        // Verify item belongs to module
        const existingItem = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!existingItem || existingItem.moduleId !== moduleId) {
            throw new Error("Item not found in this module");
        }

        return await prisma.item.delete({
            where: { id: itemId }
        });
    }

    /**
     * Forks (Deep Copies) a module for the current user.
     * Randomized order is NOT preserved; original order is kept.
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

                // 4. Copy Progress (Optimization: Batch match by order)
                // Fetch newly created items back to get their IDs
                const newItems = await tx.item.findMany({
                    where: { moduleId: newModule.id },
                    orderBy: { order: 'asc' }
                });

                // Fetch existing progress
                const sourceItemIds = sourceModule.items.map(i => i.id);
                const existingProgress = await tx.itemProgress.findMany({
                    where: { userId, itemId: { in: sourceItemIds } }
                });
                const existingSM2 = await tx.sM2Progress.findMany({
                    where: { userId, itemId: { in: sourceItemIds } }
                });

                const progressMap = new Map(existingProgress.map(p => [p.itemId, p]));
                const sm2Map = new Map(existingSM2.map(p => [p.itemId, p]));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const progressToCreate: any[] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sm2ToCreate: any[] = [];

                // Map old item progress to new item IDs
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
}
