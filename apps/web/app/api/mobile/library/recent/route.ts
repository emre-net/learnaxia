import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        let userId: string | undefined;

        // 1. Mobile JWT
        const mobileUser = await getMobileUser(req);
        if (mobileUser?.id) {
            userId = mobileUser.id;
        } else {
            // 2. Web session
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get recent learning sessions
        const recentSessions = await prisma.learningSession.findMany({
            where: { userId },
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
                    userId,
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
                    ownerId: userId,
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
