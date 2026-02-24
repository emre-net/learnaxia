
import prisma from "@/lib/prisma";

export class LibraryService {
    /**
     * Retrieves all modules in the user's library.
     */
    static async getUserLibrary(userId: string) {
        console.log(`[LibraryService] Fetching inclusive library for user: ${userId}`);

        // 1. Get modules from the join table
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

        // 2. RESCUE logic
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

        const standardResults = libraryEntries.map(e => ({ ...e, solvedCount: 0 }));
        const rescueResults = ownedModules.map(m => ({
            userId,
            moduleId: m.id,
            role: 'OWNER',
            lastInteractionAt: m.createdAt,
            module: m,
            solvedCount: 0
        }));

        const allItems = [...standardResults, ...rescueResults];
        const moduleIds = allItems.map(item => item.moduleId);
        if (moduleIds.length === 0) return [];

        const correctItems = await prisma.itemProgress.findMany({
            where: {
                userId,
                lastResult: 'CORRECT',
                item: { moduleId: { in: moduleIds } }
            },
            select: { item: { select: { moduleId: true } } }
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
