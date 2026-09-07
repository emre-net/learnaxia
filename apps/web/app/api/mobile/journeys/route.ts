import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

export async function GET(req: Request) {
    try {
        const user = await getMobileUser(req);

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const journeys = await prisma.learningJourney.findMany({
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
        });

        return NextResponse.json({ journeys });
    } catch (error) {
        console.error('Mobile Journeys Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
