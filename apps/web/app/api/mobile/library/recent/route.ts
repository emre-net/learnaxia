import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get recent learning sessions
        const recentSessions = await prisma.learningSession.findMany({
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            take: 10,
            select: {
                moduleId: true,
                startedAt: true,
                module: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        createdAt: true,
                    }
                }
            }
        });

        const seenModuleIds = new Set<string>();
        const modules: { id: string; title: string; type: string; lastStudied: string }[] = [];

        for (const session of recentSessions) {
            if (session.module && !seenModuleIds.has(session.moduleId)) {
                seenModuleIds.add(session.moduleId);
                modules.push({
                    id: session.module.id,
                    title: session.module.title,
                    type: session.module.type,
                    lastStudied: session.startedAt.toISOString(),
                });
            }
        }

        // 2. Also check userModuleLibrary for recently interacted modules
        if (modules.length < 5) {
            const libraryEntries = await prisma.userModuleLibrary.findMany({
                where: {
                    userId: user.id,
                    moduleId: { notIn: Array.from(seenModuleIds) }
                },
                take: 5 - modules.length,
                orderBy: { lastInteractionAt: 'desc' },
                select: {
                    lastInteractionAt: true,
                    module: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            createdAt: true,
                        }
                    }
                }
            });

            for (const entry of libraryEntries) {
                if (entry.module && !seenModuleIds.has(entry.module.id)) {
                    seenModuleIds.add(entry.module.id);
                    modules.push({
                        id: entry.module.id,
                        title: entry.module.title,
                        type: entry.module.type,
                        lastStudied: entry.lastInteractionAt.toISOString(),
                    });
                }
            }
        }

        // 3. Fallback: User's owned modules
        if (modules.length < 5) {
            const ownedModules = await prisma.module.findMany({
                where: {
                    ownerId: user.id,
                    id: { notIn: Array.from(seenModuleIds) }
                },
                take: 5 - modules.length,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    createdAt: true,
                }
            });

            for (const mod of ownedModules) {
                modules.push({
                    id: mod.id,
                    title: mod.title,
                    type: mod.type,
                    lastStudied: mod.createdAt.toISOString(),
                });
            }
        }

        return NextResponse.json({ modules });
    } catch (error) {
        console.error('[MOBILE_LIBRARY_RECENT_GET]', error);
        return NextResponse.json({ modules: [] }, { status: 500 });
    }
}
