
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CollectionService {

    static async create(userId: string, data: { title: string; description?: string; isPublic?: boolean; category?: string; subCategory?: string }) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const collection = await (tx as any).collection.create({
                data: {
                    title: data.title,
                    description: data.description ?? null,
                    visibility: data.isPublic ? 'PUBLIC' : 'PRIVATE',
                    ownerId: userId,
                    category: data.category ?? null,
                    subCategory: data.subCategory ?? null
                }
            });

            // 2. Add to User Library (Read Model)
            await tx.userCollectionLibrary.create({
                data: {
                    userId,
                    collectionId: collection.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date()
                }
            });

            // 3. Grant Access
            await tx.userContentAccess.create({
                data: {
                    userId,
                    resourceId: collection.id,
                    resourceType: 'COLLECTION',
                    accessLevel: 'OWNER'
                }
            });

            return collection;
        });
    }

    static async findAllUserCollections(userId: string, limit = 12, offset = 0, filters?: { search?: string, category?: string, role?: string }) {
        const collectionWhere = {
            ...(filters?.search && {
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' as any } },
                    { description: { contains: filters.search, mode: 'insensitive' as any } }
                ]
            }),
            ...(filters?.category && filters.category !== 'ALL' && { category: filters.category }),
        };

        const hasFilters = Object.keys(collectionWhere).length > 0;

        const total = await prisma.userCollectionLibrary.count({
            where: {
                userId,
                ...(filters?.role && filters.role !== 'all' && { role: filters.role === 'created' ? 'OWNER' : 'SAVED' }),
                ...(hasFilters && { collection: collectionWhere })
            }
        });

        const userLibrary = await prisma.userCollectionLibrary.findMany({
            where: {
                userId,
                ...(filters?.role && filters.role !== 'all' && { role: filters.role === 'created' ? 'OWNER' : 'SAVED' }),
                ...(hasFilters && { collection: collectionWhere })
            },
            include: {
                collection: {
                    include: {
                        owner: {
                            select: { handle: true, image: true, isVerified: true }
                        },
                        items: { select: { moduleId: true } }, // Fetch item count
                        _count: { select: { userLibrary: { where: { role: 'SAVED' } } } }
                    }
                }
            },
            orderBy: { lastInteractionAt: 'desc' },
            skip: offset,
            take: limit
        });

        return { items: userLibrary, total };
    }
    static async getById(userId: string, collectionId: string) {
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
            include: {
                owner: { select: { handle: true, id: true } },
                items: {
                    include: {
                        module: {
                            select: { id: true, title: true, type: true, status: true, visibility: true, items: { select: { id: true } } }
                        } as any
                    },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { items: true, userLibrary: { where: { role: 'SAVED' } } } }
            }
        });

        if (!collection) throw new Error("Collection not found");

        // Access Rule: PUBLIC or OWNER or linked access (PRIVATE but has ID)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((collection as any).visibility === 'PRIVATE' && collection.ownerId !== userId) {
            // Implicit access via Link is allowed for PRIVATE collections
        }

        // Extract modules from items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modules = (collection as any).items.map((item: any) => item.module);

        return {
            ...collection,
            modules: modules
        };
    }

    static async update(userId: string, collectionId: string, data: { title?: string; description?: string; isPublic?: boolean; moduleIds?: string[]; category?: string; subCategory?: string }) {
        // Check Access
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: collectionId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Update Access");
        }

        // Transaction to update details and items
        return await prisma.$transaction(async (tx) => {
            // Update basic details
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).collection.update({
                where: { id: collectionId },
                data: {
                    title: data.title,
                    description: data.description || null,
                    visibility: data.isPublic ? 'PUBLIC' : 'PRIVATE',
                    category: data.category || null,
                    subCategory: data.subCategory || null,
                    ownerId: userId
                }
            });

            // Update items if moduleIds provided
            if (data.moduleIds) {
                // Delete existing items
                await tx.collectionItem.deleteMany({ where: { collectionId } });

                // Create new items
                if (data.moduleIds.length > 0) {
                    await tx.collectionItem.createMany({
                        data: data.moduleIds.map((moduleId, index) => ({
                            collectionId,
                            moduleId,
                            order: index
                        }))
                    });
                }
            }

            return await tx.collection.findUnique({ where: { id: collectionId } });
        });
    }
}
