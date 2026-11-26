import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import { mergeUserSettings } from '@/lib/user-settings';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const user = await getMobileUser(req);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const slideIndex = typeof body.slideIndex === 'number' && body.slideIndex >= 0
            ? Math.floor(body.slideIndex)
            : 0;

        const journey = await prisma.learningJourney.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { userLibrary: { some: { userId: user.id } } }
                ]
            },
            select: { id: true }
        });

        if (!journey) {
            return NextResponse.json({ message: 'Journey not found' }, { status: 404 });
        }

        await Promise.all([
            prisma.learningJourney.update({
                where: { id },
                data: { updatedAt: new Date() }
            }),
            mergeUserSettings(user.id, (curr) => ({
                ...curr,
                journeyProgress: {
                    ...(curr.journeyProgress || {}),
                    [id]: slideIndex,
                },
            })),
        ]);

        return NextResponse.json({ ok: true, slideIndex });
    } catch (error) {
        console.error('[MOBILE_JOURNEY_PROGRESS_POST]', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
