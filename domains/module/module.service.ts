
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createHash } from 'crypto';
import { ForkService } from "./fork.service";
import { LibraryService } from "./library.service";

/**
 * Computes a deterministic content hash for an item.
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
            const module = await tx.module.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    type: dto.type,
                    isForkable: dto.isForkable ?? true,
                    status: dto.status ?? 'DRAFT',
                    ownerId: userId,
                    creatorId: userId,
                    category: dto.category ?? null,
                    subCategory: dto.subCategory ?? null,
                },
            });

            if (dto.items && dto.items.length > 0) {
                const itemsData = dto.items.map((item, index) => ({
                    moduleId: module.id,
                    type: dto.type,
                    content: item as Prisma.InputJsonValue,
                    contentHash: computeContentHash(item),
                    order: index,
                }));
                await tx.item.createMany({ data: itemsData });
            }

            await tx.userModuleLibrary.create({
                data: {
                    userId: userId,
                    moduleId: module.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date(),
                },
            });

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
     * Delegates to LibraryService.
     */
    static async getUserLibrary(userId: string, limit = 12, offset = 0, filters?: { search?: string, type?: string, category?: string, role?: string }) {
        return LibraryService.getUserLibrary(userId, limit, offset, filters);
    }

    /**
     * Delegates to LibraryService.
     */
    static async getDiscoverModules(userId: string, search?: string) {
        return LibraryService.getDiscoverModules(userId, search);
    }

    /**
     * Gets a single module detail with library status.
     */
    static async getById(userId: string, moduleId: string) {
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
                },
                _count: {
                    select: { userLibrary: { where: { userId: userId } } }
                }
            }
        });

        if (!module) throw new Error("Module not found");

        const isInLibrary = module._count.userLibrary > 0;
        const visibility = (module as any).visibility;

        if (visibility === 'PUBLIC' || module.ownerId === userId || visibility === 'PRIVATE') {
            return { ...module, isInLibrary };
        }

        throw new Error("Unauthorized Access");
    }

    /**
     * Updates module metadata and synchronizes items.
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
                visibility: (dto as any).visibility as any,
                status: dto.status,
                category: dto.category,
                subCategory: dto.subCategory,
            }
        });

        if (dto.items) {
            const items = dto.items;
            await prisma.$transaction(async (tx: any) => {
                const existingItems = await tx.item.findMany({
                    where: { moduleId },
                    select: { id: true }
                });
                const existingItemIds = new Set(existingItems.map((i: any) => i.id));
                const incomingItemIds = new Set(items.filter((i: any) => i.id && existingItemIds.has(i.id)).map((i: any) => i.id));
                const itemsToCreate = items.filter((i: any) => !i.id || !existingItemIds.has(i.id));

                const itemsToDelete = existingItems.filter((i: any) => !incomingItemIds.has(i.id)).map((i: any) => i.id);
                if (itemsToDelete.length > 0) {
                    await tx.item.deleteMany({ where: { id: { in: itemsToDelete } } });
                }

                for (const item of items) {
                    if (item.id && existingItemIds.has(item.id)) {
                        await tx.item.update({
                            where: { id: item.id },
                            data: {
                                content: item.content as Prisma.InputJsonValue,
                                contentHash: computeContentHash(item.content),
                                order: item.order,
                                type: dto.type
                            }
                        });
                    }
                }

                if (itemsToCreate.length > 0) {
                    await tx.item.createMany({
                        data: itemsToCreate.map(item => ({
                            moduleId: moduleId,
                            type: dto.type || 'FLASHCARD',
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

    /**
     * Soft Delete / Archive module.
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
            data: { status: 'ARCHIVED', archivedAt: new Date() } as any
        });
    }

    /**
     * Adds an item to a module.
     */
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

    static async addToLibrary(userId: string, moduleId: string) {
        return LibraryService.addToLibrary(userId, moduleId);
    }

    static async fork(userId: string, sourceModuleId: string) {
        return ForkService.fork(userId, sourceModuleId);
    }

    /**
     * Specialized update handler that supports Fork-on-Edit.
     */
    static async updateItem(userId: string, moduleId: string, itemId: string, itemData: any) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            const module = await prisma.module.findUnique({ where: { id: moduleId } });
            if (!module || !module.isForkable) throw new Error("Unauthorized or not forkable");

            const originalItem = await prisma.item.findUnique({ where: { id: itemId } });
            const newHash = computeContentHash(itemData.content);

            if (originalItem && originalItem.contentHash === newHash) return originalItem;

            const result = await ForkService.forkAndApplyUpdate(userId, moduleId, itemId, itemData);
            return { ...result.item, _meta: { forkedModuleId: result.module.id } };
        }

        return await prisma.item.update({
            where: { id: itemId },
            data: {
                content: itemData.content as Prisma.InputJsonValue,
                contentHash: computeContentHash(itemData.content),
                type: itemData.type,
            }
        });
    }

    /**
     * Deletes an item, with Fork-on-Edit support.
     */
    static async deleteItem(userId: string, moduleId: string, itemId: string) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            const module = await prisma.module.findUnique({ where: { id: moduleId } });
            if (!module || !module.isForkable) throw new Error("Unauthorized or not forkable");

            const newModule = await ForkService.fork(userId, moduleId);
            const newItem = await prisma.item.findFirst({
                where: { moduleId: newModule.id, sourceItemId: itemId }
            });

            if (newItem) await prisma.item.delete({ where: { id: newItem.id } });
            return { success: true, forkedModuleId: newModule.id };
        }

        return await prisma.item.delete({ where: { id: itemId } });
    }
}
