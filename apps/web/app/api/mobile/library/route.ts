import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get user's modules (created and saved/learned)
        const modules = await prisma.module.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { userLibrary: { some: { userId: user.id } } }
                ]
            },
            include: {
                owner: { select: { name: true, image: true } },
                _count: { select: { items: true, userLibrary: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get user's collections
        const collections = await prisma.collection.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { userLibrary: { some: { userId: user.id } } }
                ]
            },
            include: {
                owner: { select: { name: true, image: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get user's notes
        const notes = await prisma.note.findMany({
            where: {
                userId: user.id
            },
            orderBy: { updatedAt: 'desc' } // or createdAt
        });

        return NextResponse.json({
            modules,
            collections,
            notes
        });
    } catch (error) {
        console.error('Mobile Library Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
