import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/user/account
 *
 * Kullanıcı hesabını siler.
 * - Önce soft delete (deletedAt, status=DELETED)
 * - 30 gün sonra cron ile hard delete uygulanabilir
 * - Apple App Store Guideline 5.1.1 zorunluluğu
 */
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Kullanıcının kendi hesabını sildiğini doğrula
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, deletedAt: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        if (user.deletedAt) {
            return NextResponse.json({ error: 'Hesap zaten silinmiş.' }, { status: 400 });
        }

        // Soft delete: 30 gün sonra hard delete için işaretle
        await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'DELETED',
                deletedAt: new Date(),
                // Email'i anonimleştir — böylece aynı email ile yeniden kayıt açık kalır
                email: `deleted_${userId}@learnaxia.deleted`,
                name: 'Silinmiş Kullanıcı',
                handle: null,
                image: null,
            }
        });

        // Mobile refresh token'larını iptal et
        await prisma.mobileRefreshToken.updateMany({
            where: { userId },
            data: { revokedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message: 'Hesabınız başarıyla silindi. Verileriniz 30 gün içinde kalıcı olarak kaldırılacak.'
        });

    } catch (error) {
        console.error('[DELETE /api/user/account]', error);
        return NextResponse.json({ error: 'Hesap silinemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
}
