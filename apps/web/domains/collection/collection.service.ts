import prisma from "@/lib/prisma";

export class CollectionService {

    static async create(userId: string, data: { title: string; description?: string; isPublic?: boolean; category?: string; subCategory?: string }) {
        return await prisma.$transaction(async (tx) => {
            const collection = await tx.collection.create({
                data: {
                    title: data.title,
                    description: data.description ?? null,
                    visibility: data.isPublic ? 'PUBLIC' : 'PRIVATE',
                    ownerId: userId,
                    category: data.category ?? null,
                    subCategory: data.subCategory ?? null
                }
            });

            await tx.userCollectionLibrary.create({
                data: {
                    userId,
                    collectionId: collection.id,
                    role: 'OWNER',
                    lastInteractionAt: new Date()
                }
            });

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
                    { title: { contains: filters.search, mode: 'insensitive' as const } },
                    { description: { contains: filters.search, mode: 'insensitive' as const } }
                ]
            }),
            ...(filters?.category && filters.category !== 'ALL' && { category: filters.category }),
        };

        const hasFilters = Object.keys(collectionWhere).length > 0;

        const whereClause = {
            userId,
            ...(filters?.role && filters.role !== 'all' && { role: filters.role === 'created' ? 'OWNER' : 'SAVED' }),
            ...(hasFilters && { collection: collectionWhere })
        };

        const [total, userLibrary] = await Promise.all([
            prisma.userCollectionLibrary.count({ where: whereClause }),
            prisma.userCollectionLibrary.findMany({
                where: whereClause,
                include: {
                    collection: {
                        include: {
                            owner: { select: { handle: true, image: true, name: true } },
                            items: { select: { moduleId: true } },
                            _count: { select: { userLibrary: { where: { role: 'SAVED' } } } }
                        }
                    }
                },
                orderBy: { lastInteractionAt: 'desc' },
                skip: offset,
                take: limit
            })
        ]);

        return { items: userLibrary, total };
    }

    static async getById(userId: string, collectionId: string) {
        const [collection, savedRecord] = await Promise.all([
            prisma.collection.findUnique({
                where: { id: collectionId },
                include: {
                    owner: { select: { handle: true, id: true, name: true, image: true } },
                    items: {
                        include: {
                            module: {
                                select: { id: true, title: true, type: true, status: true, visibility: true, items: { select: { id: true } } }
                            }
                        },
                        orderBy: { order: 'asc' }
                    },
                    _count: { select: { items: true, userLibrary: { where: { role: 'SAVED' } } } }
                }
            }),
            prisma.userCollectionLibrary.findUnique({
                where: { userId_collectionId: { userId, collectionId } },
                select: { role: true }
            })
        ]);

        if (!collection) throw new Error("Collection not found");

        if (collection.visibility === 'PRIVATE' && collection.ownerId !== userId && !savedRecord) {
            throw new Error("Unauthorized Access");
        }

        const modules = collection.items.map(item => item.module);

        return {
            ...collection,
            modules,
            isOwner: collection.ownerId === userId,
            isSaved: Boolean(savedRecord),
        };
    }

    static async update(userId: string, collectionId: string, data: { title?: string; description?: string; isPublic?: boolean; moduleIds?: string[]; category?: string; subCategory?: string }) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: collectionId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Update Access");
        }

        return await prisma.$transaction(async (tx) => {
            await tx.collection.update({
                where: { id: collectionId },
                data: {
                    ...(data.title !== undefined && { title: data.title }),
                    ...(data.description !== undefined && { description: data.description || null }),
                    ...(data.isPublic !== undefined && { visibility: data.isPublic ? 'PUBLIC' : 'PRIVATE' }),
                    ...(data.category !== undefined && { category: data.category || null }),
                    ...(data.subCategory !== undefined && { subCategory: data.subCategory || null }),
                }
            });

            if (data.moduleIds) {
                await tx.collectionItem.deleteMany({ where: { collectionId } });

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

    static async delete(userId: string, collectionId: string) {
        const access = await prisma.userContentAccess.findUnique({
            where: { userId_resourceId: { userId, resourceId: collectionId } }
        });

        if (!access || access.accessLevel !== 'OWNER') {
            throw new Error("Unauthorized Delete Access");
        }

        await prisma.$transaction([
            prisma.collectionItem.deleteMany({ where: { collectionId } }),
            prisma.userCollectionLibrary.deleteMany({ where: { collectionId } }),
            prisma.userContentAccess.deleteMany({ where: { resourceId: collectionId } }),
            prisma.collection.delete({ where: { id: collectionId } }),
        ]);

        return { success: true };
    }
}
