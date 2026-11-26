import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const typeFilter = searchParams.get('type')?.toUpperCase();

        const [modules, collections, notes, journeys, solvedQuestions] = await Promise.all([
            prisma.module.findMany({
                where: {
                    status: { not: 'ARCHIVED' },
                    OR: [
                        { ownerId: user.id },
                        { userLibrary: { some: { userId: user.id } } }
                    ]
                },
                include: {
                    owner: { select: { id: true, name: true, handle: true, image: true } },
                    _count: { select: { items: true, userLibrary: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.collection.findMany({
                where: {
                    OR: [
                        { ownerId: user.id },
                        { userLibrary: { some: { userId: user.id } } }
                    ]
                },
                include: {
                    owner: { select: { id: true, name: true, handle: true, image: true } },
                    _count: { select: { items: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.note.findMany({
                where: { userId: user.id },
                orderBy: { updatedAt: 'desc' }
            }),
            prisma.learningJourney.findMany({
                where: {
                    OR: [
                        { userId: user.id },
                        { userLibrary: { some: { userId: user.id } } }
                    ]
                },
                include: {
                    _count: { select: { slides: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.solvedQuestion.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    notes: { select: { id: true, title: true } }
                }
            })
        ]);

        const typeItemsMap: Record<string, unknown[]> = {
            MODULE: modules,
            COLLECTION: collections,
            NOTE: notes,
            JOURNEY: journeys,
            SOLUTION: solvedQuestions,
        };

        return NextResponse.json({
            ...(typeFilter && typeItemsMap[typeFilter] ? { items: typeItemsMap[typeFilter] } : {}),
            modules,
            collections,
            notes,
            journeys,
            solvedQuestions
        });
    } catch (error) {
        console.error('Mobile Library Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
