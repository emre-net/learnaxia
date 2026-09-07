import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-jwt';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/mobile/user/account
 * Mobil uygulama için hesap silme — App Store zorunluluğu
 */
export async function DELETE(req: Request) {
    try {
        const user = await getMobileUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, deletedAt: true }
        });

        if (!dbUser) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        if (dbUser.deletedAt) {
            return NextResponse.json({ message: 'Hesap zaten silinmiş.' }, { status: 400 });
        }

        // Soft delete
        await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'DELETED',
                deletedAt: new Date(),
                email: `deleted_${userId}@learnaxia.deleted`,
                name: 'Silinmiş Kullanıcı',
                handle: null,
                image: null,
            }
        });

        // Tüm mobile token'ları iptal et
        await prisma.mobileRefreshToken.updateMany({
            where: { userId },
            data: { revokedAt: new Date() }
        });

        return NextResponse.json({
            ok: true,
            message: 'Hesabınız başarıyla silindi. Verileriniz 30 gün içinde kalıcı olarak kaldırılacak.'
        });

    } catch (error) {
        console.error('[Mobile DELETE /user/account]', error);
        return NextResponse.json({ message: 'Hesap silinemedi.' }, { status: 500 });
    }
}
