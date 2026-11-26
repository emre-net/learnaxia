import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { getUserSettings } from '@/lib/user-settings';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const user = await getMobileUser(req);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const [journey, settings] = await Promise.all([
            prisma.learningJourney.findFirst({
                where: {
                    id,
                    OR: [
                        { userId: user.id },
                        { userLibrary: { some: { userId: user.id } } }
                    ]
                },
                include: {
                    slides: {
                        orderBy: { order: 'asc' }
                    },
                    _count: { select: { slides: true } }
                }
            }),
            getUserSettings(user.id),
        ]);

        if (!journey) {
            return NextResponse.json({ message: 'Journey not found' }, { status: 404 });
        }

        const lastSlideIndex = typeof settings.journeyProgress?.[id] === 'number'
            ? settings.journeyProgress[id]
            : 0;

        return NextResponse.json({
            journey,
            lastSlideIndex,
            isOwner: journey.userId === user.id,
        });
    } catch (error) {
        console.error('Mobile Journey Detail Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const user = await getMobileUser(req);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const journey = await prisma.learningJourney.findUnique({
            where: { id },
            select: { id: true, userId: true }
        });

        if (!journey) {
            return NextResponse.json({ message: 'Journey not found' }, { status: 404 });
        }

        if (journey.userId !== user.id) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await prisma.learningJourney.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mobile Journey Delete Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
