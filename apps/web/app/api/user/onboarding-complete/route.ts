import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/user/onboarding-complete
 * Kullanıcının onboarding'i tamamladığını settings JSON'una kaydeder.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { settings: true }
        });

        const currentSettings = (user?.settings as Record<string, unknown>) || {};

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                settings: {
                    ...currentSettings,
                    onboardingComplete: true,
                    onboardingCompletedAt: new Date().toISOString(),
                }
            }
        });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('[POST /api/user/onboarding-complete]', error);
        return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 });
    }
}
