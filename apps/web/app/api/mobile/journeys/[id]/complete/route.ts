import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUser } from '@/lib/auth/mobile-jwt';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/mobile/journeys/[id]/complete
 * Son slide'a ulaşıldığında çağrılır.
 * Journey status'unu COMPLETED yapar.
 * Momentum skor hesaplama cron'u bu veriyi alır.
 */
export async function POST(req: Request, { params }: RouteParams) {
    try {
        const user = await getMobileUser(req);
        const { id } = await params;

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Journey'nin bu kullanıcıya ait veya kütüphanesinde olduğunu doğrula
        const journey = await prisma.learningJourney.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { userLibrary: { some: { userId: user.id } } }
                ]
            },
            select: { id: true, status: true, userId: true }
        });

        if (!journey) {
            return NextResponse.json({ message: 'Journey not found' }, { status: 404 });
        }

        // Zaten tamamlanmışsa tekrar işleme gerek yok
        if (journey.status === 'COMPLETED') {
            return NextResponse.json({ ok: true, alreadyCompleted: true });
        }

        // Status güncelle
        await prisma.learningJourney.update({
            where: { id },
            data: { status: 'COMPLETED', updatedAt: new Date() }
        });

        // StudySessionLog'a journey completion kaydı ekle (skor hesabı için)
        await prisma.studySessionLog.create({
            data: {
                userId: user.id,
                moduleId: null,     // Journey modül değil
                source: 'journey',
                startedAt: new Date(),
                endedAt: new Date(),
                durationSec: 0,     // Journey için süre takibi ayrı
                cardsAttempted: 0,
                cardsCorrect: 0,
                accuracyRate: 0,
            }
        });

        return NextResponse.json({ ok: true, completed: true });
    } catch (error) {
        console.error('Mobile Journey Complete Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
