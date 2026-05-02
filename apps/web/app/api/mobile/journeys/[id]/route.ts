import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

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

        const journey = await prisma.learningJourney.findUnique({
            where: { id },
            include: {
                slides: {
                    orderBy: { order: 'asc' }
                },
                _count: { select: { slides: true } }
            }
        });

        if (!journey) {
            return NextResponse.json({ message: 'Journey not found' }, { status: 404 });
        }

        return NextResponse.json({ journey });
    } catch (error) {
        console.error('Mobile Journey Detail Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
