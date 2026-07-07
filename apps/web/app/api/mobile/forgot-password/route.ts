import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const Schema = z.object({
    email: z.string().email()
});

/**
 * POST /api/mobile/forgot-password
 * Şifre sıfırlama e-postası gönderir.
 * Token 1 saat geçerli, VerificationToken tablosuna kaydedilir.
 */
export async function POST(req: Request) {
    try {
        // Resend initialized here (runtime) so build doesn't throw when key is missing
        const resend = new Resend(process.env.RESEND_API_KEY);
        // IP rate limit — dakikada 3 istek
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0] ?? 'unknown';
        const limited = await checkRateLimit({
            key: `forgot_password:${ip}`,
            limit: 3,
            windowMs: 60 * 1000
        });
        if (!limited.allowed) {
            return NextResponse.json(
                { message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ message: 'Geçersiz e-posta adresi.' }, { status: 400 });
        }

        const { email } = parsed.data;

        // Kullanıcı var mı? (Var/yok bilgisini response'a verme — timing attack önlemi)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, email: true, name: true, password: true, deletedAt: true }
        });

        // Kullanıcı yoksa, yok gibi davranma — güvenlik
        if (!user || user.deletedAt || !user.password) {
            // Yine de 200 dön (enumeration attack'ı önler)
            return NextResponse.json({ ok: true });
        }

        // Mevcut token'ları temizle
        await prisma.verificationToken.deleteMany({
            where: { identifier: `reset:${email.toLowerCase()}` }
        });

        // Yeni token oluştur — 1 saat geçerli
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.verificationToken.create({
            data: {
                identifier: `reset:${email.toLowerCase()}`,
                token,
                expires
            }
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'https://learnaxia.com'}/auth/reset-password?token=${token}`;

        // E-posta gönder
        await resend.emails.send({
            from: 'Learnaxia <noreply@learnaxia.com>',
            to: user.email!,
            subject: 'Şifre Sıfırlama Talebi',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0f1c; color: #f8fafc; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Learnaxia</h1>
                        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Şifre Sıfırlama</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="margin: 0 0 16px; font-size: 16px;">Merhaba ${user.name || 'Değerli Kullanıcı'},</p>
                        <p style="margin: 0 0 24px; color: #94a3b8; line-height: 1.6;">
                            Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
                        </p>
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">
                            Şifremi Sıfırla
                        </a>
                        <p style="margin: 24px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                            Bu bağlantı <strong>1 saat</strong> geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
                        </p>
                        <p style="margin: 8px 0 0; color: #475569; font-size: 12px;">
                            Bağlantı çalışmıyorsa bu URL'yi kopyalayın: <br />
                            <span style="color: #60a5fa; word-break: break-all;">${resetUrl}</span>
                        </p>
                    </div>
                    <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                        <p style="margin: 0; color: #475569; font-size: 12px;">© ${new Date().getFullYear()} Learnaxia. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            `
        });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('[POST /api/mobile/forgot-password]', error);
        return NextResponse.json({ message: 'Bir hata oluştu. Lütfen tekrar deneyin.' }, { status: 500 });
    }
}
