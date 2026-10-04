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

        // 1. Get recent study sessions to find modules the user studied recently
        const recentSessions = await prisma.studySession.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                moduleId: true,
                createdAt: true,
                module: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        updatedAt: true,
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
                    lastStudied: session.createdAt.toISOString(),
                });
            }
        }

        // 2. If fewer than 5, fill with user's created or library modules
        if (modules.length < 5) {
            const fallbackModules = await prisma.module.findMany({
                where: {
                    OR: [
                        { ownerId: user.id },
                        { userLibrary: { some: { userId: user.id } } }
                    ],
                    id: { notIn: Array.from(seenModuleIds) }
                },
                take: 5 - modules.length,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    updatedAt: true,
                }
            });

            for (const mod of fallbackModules) {
                modules.push({
                    id: mod.id,
                    title: mod.title,
                    type: mod.type,
                    lastStudied: mod.updatedAt.toISOString(),
                });
            }
        }

        return NextResponse.json({ modules });
    } catch (error) {
        console.error('[MOBILE_LIBRARY_RECENT_GET]', error);
        return NextResponse.json({ modules: [] }, { status: 500 });
    }
}
