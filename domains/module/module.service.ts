
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
    type: 'FLASHCARD' | 'MC' | 'GAP';
    isForkable?: boolean;
    status?: 'DRAFT' | 'ACTIVE';
    items?: any[]; // We'll type this better later or use Json
};

export class ModuleService {
    /**
     * Creates a new module with transactional integrity.
     * Ensures:
     * 1. Module creation
     * 2. Items creation (if provided)
     * 3. UserModuleLibrary update (Read Model)
     * 4. UserContentAccess grant (Lock)
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
                },
            });

            // 2. Create Items (if any)
            if (dto.items && dto.items.length > 0) {
                // Prepare items with moduleId and contentHash
                const itemsData = dto.items.map((item, index) => ({
                    moduleId: module.id,
                    type: dto.type, // All items inherit module type for now
                    content: item as Prisma.InputJsonValue,
                    contentHash: computeContentHash(item),
                    order: index,
                    // sourceItemId null for new items
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
     * Retrieves user's library modules with basic filtering.
     * Uses the UserModuleLibrary read model for performance.
     */
    static async getUserLibrary(userId: string) {
        // Join with Module table to get details
        // Note: In a massive scale, we might denormalize title/desc into Library, 
        // but for now Update Logic complexity > Join cost.
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
     * Gets a single module detail verifying access.
     */
    static async getById(userId: string, moduleId: string) {
        // Check Access First
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
     * Note: This does NOT handle item updates (that's a separate atomic operation).
     */
    static async update(userId: string, moduleId: string, dto: Partial<CreateModuleDto>) {
        // Check Ownership/Access via ContentAccess
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
                status: dto.status
            }
        });
    }

    static async addItem(userId: string, moduleId: string, itemData: any) {
        // Check Access
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || (access.accessLevel !== 'OWNER' && access.accessLevel !== 'EDITOR')) {
            throw new Error("Unauthorized Add Item Access");
        }

        // Get max order (to append)
        const lastItem = await prisma.item.findFirst({
            where: { moduleId },
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastItem?.order ?? -1) + 1;

        // Create Item
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
     * Archives a module (Soft Delete).
     * Effectively removes it from Library view but keeps it accessible for existing users.
     */
    static async archive(userId: string, moduleId: string) {
        // Check Access
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: moduleId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Archive Access");
        }

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update Module Status
            const module = await tx.module.update({
                where: { id: moduleId },
                data: { status: 'ARCHIVED' } // Assuming 'ARCHIVED' is a valid status string or enum in schema
            });

            // 2. Remove from UserLibrary (Cleanup Read Model)
            // We hard delete from library because it's just a view/pointer.
            await tx.userModuleLibrary.delete({
                where: { userId_moduleId: { userId, moduleId } }
            });

            return module;
        });
    }
}
