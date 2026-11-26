import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { getUserSettings } from '@/lib/user-settings';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: moduleId } = await params;

        const [mod, libraryAccess, contentAccess, settings] = await Promise.all([
            prisma.module.findUnique({
                where: { id: moduleId },
                include: {
                    items: {
                        orderBy: { order: 'asc' }
                    }
                }
            }),
            prisma.userModuleLibrary.findUnique({
                where: { userId_moduleId: { userId: user.id, moduleId } },
                select: { userId: true }
            }),
            prisma.userContentAccess.findUnique({
                where: { userId_resourceId: { userId: user.id, resourceId: moduleId } },
                select: { userId: true }
            }),
            getUserSettings(user.id),
        ]);

        if (!mod) {
            return NextResponse.json({ message: 'Module not found' }, { status: 404 });
        }

        const hasAccess =
            mod.ownerId === user.id ||
            mod.visibility === 'PUBLIC' ||
            Boolean(libraryAccess) ||
            Boolean(contentAccess);

        if (!hasAccess) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const moduleItemIds = new Set(mod.items.map((it) => it.id));
        const allBookmarked = Array.isArray(settings.bookmarkedItemIds) ? settings.bookmarkedItemIds : [];
        const bookmarkedItemIds = allBookmarked.filter((id) => moduleItemIds.has(id));

        return NextResponse.json({ module: mod, bookmarkedItemIds });
    } catch (error) {
        console.error('Mobile Study Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
