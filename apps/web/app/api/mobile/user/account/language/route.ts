import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({
    language: z.enum(['tr', 'en'])
});

/**
 * PATCH /api/mobile/user/account/language
 * Kullanıcının dil tercihini günceller.
 */
export async function PATCH(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ message: 'Geçersiz dil değeri. "tr" veya "en" olmalı.' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { language: parsed.data.language }
        });

        return NextResponse.json({ ok: true, language: parsed.data.language });

    } catch (error) {
        console.error('[PATCH /api/mobile/user/account/language]', error);
        return NextResponse.json({ message: 'Dil güncellenemedi.' }, { status: 500 });
    }
}
