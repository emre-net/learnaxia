
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CollectionService {

    static async create(userId: string, data: { title: string; description?: string; isPublic?: boolean; category?: string; subCategory?: string }) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const collection = await (tx as any).collection.create({
                data: {
                    title: data.title,
                    description: data.description ?? null,
                    isPublic: data.isPublic ?? false,
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

    static async findAllUserCollections(userId: string) {
        const userLibrary = await prisma.userCollectionLibrary.findMany({
            where: { userId },
            include: {
                collection: {
                    include: {
                        owner: {
                            select: { handle: true }
                        },
                        items: { select: { moduleId: true } }, // Fetch item count
                        _count: { select: { userLibrary: true } }
                    }
                }
            },
            orderBy: { lastInteractionAt: 'desc' }
        });
        return userLibrary;
    }

    static async getById(userId: string, collectionId: string) {
        // Check access
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: collectionId } }
        });

        if (!access) throw new Error("Unauthorized");

        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
            include: {
                owner: { select: { handle: true } },
                items: {
                    include: {
                        module: {
                            select: { id: true, title: true, type: true, status: true, items: { select: { id: true } } }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { items: true, userLibrary: true } }
            }
        });

        if (!collection) throw new Error("Collection not found");

        // Extract modules from items
        const modules = collection.items.map((item: any) => item.module);

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
            await (tx as any).collection.update({
                where: { id: collectionId },
                data: {
                    title: data.title,
                    description: data.description || null,
                    isPublic: data.isPublic || false,
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
