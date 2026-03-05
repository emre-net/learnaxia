
import prisma from "@/lib/prisma";

export class LibraryService {
    /**
     * Retrieves all modules in the user's library.
     */
    static async getUserLibrary(userId: string, limit = 12, offset = 0, filters?: { search?: string, type?: string, category?: string, role?: string }) {
        console.log(`[LibraryService] Fetching paginated library for user: ${userId}, limit: ${limit}, offset: ${offset}`);

        // 1. RESCUE logic - sync missing owned modules to library FIRST
        const existingLibraryModuleIds = (await prisma.userModuleLibrary.findMany({
            where: { userId },
            select: { moduleId: true }
        })).map((e: { moduleId: string }) => e.moduleId);

        const missingOwnedModules = await prisma.module.findMany({
            where: {
                ownerId: userId,
                id: { notIn: existingLibraryModuleIds }
            },
            select: { id: true, createdAt: true }
        });

        if (missingOwnedModules.length > 0) {
            await prisma.userModuleLibrary.createMany({
                data: missingOwnedModules.map((m: { id: string, createdAt: Date }) => ({
                    userId,
                    moduleId: m.id,
                    role: 'OWNER',
                    lastInteractionAt: m.createdAt
                })),
                skipDuplicates: true
            });
        }

        // 2. Fetch paginated library entries
        const moduleWhere = {
            ...(filters?.search && {
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' as any } },
                    { description: { contains: filters.search, mode: 'insensitive' as any } }
                ]
            }),
            ...(filters?.type && filters.type !== 'ALL' && { type: filters.type as any }),
            ...(filters?.category && filters.category !== 'ALL' && { category: filters.category }),
        };

        const hasModuleFilters = Object.keys(moduleWhere).length > 0;

        const total = await prisma.userModuleLibrary.count({
            where: {
                userId,
                ...(filters?.role && filters.role !== 'all' && { role: filters.role === 'created' ? 'OWNER' : 'SAVED' }),
                ...(hasModuleFilters && { module: moduleWhere })
            }
        });

        const libraryEntries = await prisma.userModuleLibrary.findMany({
            where: {
                userId,
                ...(filters?.role && filters.role !== 'all' && { role: filters.role === 'created' ? 'OWNER' : 'SAVED' }),
                ...(hasModuleFilters && { module: moduleWhere })
            },
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
            orderBy: { lastInteractionAt: 'desc' },
            skip: offset,
            take: limit
        });

        if (libraryEntries.length === 0) return { items: [], total };

        // 3. Compute solved progress
        const moduleIds = libraryEntries.map((e: { moduleId: string }) => e.moduleId);
        const correctItems = await prisma.itemProgress.findMany({
            where: {
                userId,
                lastResult: 'CORRECT',
                item: { moduleId: { in: moduleIds } }
            },
            select: { item: { select: { moduleId: true } } }
        });

        const solvedMap: Record<string, number> = {};
        correctItems.forEach((p: { item: { moduleId: string } }) => {
            const mid = p.item.moduleId;
            solvedMap[mid] = (solvedMap[mid] || 0) + 1;
        });

        const items = libraryEntries.map((entry: any) => ({
            ...entry,
            solvedCount: solvedMap[entry.moduleId] || 0
        }));

        return { items, total };
    }

    /**
     * Retrieves public modules for Discovery.
     */
    static async getDiscoverModules(userId: string, search?: string) {
        return await prisma.module.findMany({
            where: {
                status: 'ACTIVE',
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
                owner: { select: { handle: true, image: true } },
                _count: { select: { items: true, userLibrary: { where: { role: 'SAVED' } }, forks: true, sessions: true } }
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Adds a module to the user's library.
     */
    static async addToLibrary(userId: string, moduleId: string) {
        const existing = await prisma.userModuleLibrary.findUnique({
            where: { userId_moduleId: { userId, moduleId } }
        });

        if (existing) return existing;

        return await prisma.userModuleLibrary.create({
            data: {
                userId,
                moduleId,
                role: 'SAVED',
                lastInteractionAt: new Date()
            }
        });
    }
}
