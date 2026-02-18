
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
                    category: dto.category,
                    subCategory: dto.subCategory,
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
     * Retrieves user's library modules.
     */
    static async getUserLibrary(userId: string) {
        return await prisma.userModuleLibrary.findMany({
            where: { userId },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        status: true,
                        isForkable: true,
                        createdAt: true,
                        category: true,
                        subCategory: true,
                        _count: {
                            select: { items: true }
                        }
                    }
                }
            },
            orderBy: { lastInteractionAt: 'desc' }
        });
    }

    /**
     * Gets a single module detail.
     */
    static async getById(userId: string, moduleId: string) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access) {
            throw new Error("Unauthorized Access");
        }

        return await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                },
                owner: {
                    select: { handle: true, image: true }
                }
            }
        });
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

        return await prisma.module.update({
            where: { id: moduleId },
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type,
                isForkable: dto.isForkable,
                status: dto.status,
                category: dto.category,
                subCategory: dto.subCategory,
            }
        });
    }

    // Other methods remain largely unchanged, but keeping them here for completeness if needed
    // Assuming Archive/AddItem logic is standard.
    /**
     * Archives a module (Soft Delete).
     */
    static async archive(userId: string, moduleId: string) {
        return await this.update(userId, moduleId, { status: 'ARCHIVED' } as any);
    }

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
}
