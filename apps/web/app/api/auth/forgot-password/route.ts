import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // Resend initialized here (runtime) so build doesn't throw when key is missing
        const resend = new Resend(process.env.RESEND_API_KEY);

        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // H3: Rate limit — IP başına dakikada 3 istek
        const ipLimit = await checkRateLimit({
            key: `forgot-pw:${ip}`,
            limit: 3,
            windowMs: 60 * 1000
        });
        if (!ipLimit.allowed) {
            return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.' }, { status: 429 });
        }

        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "E-posta adresi gereklidir." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ success: "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir." });
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        // Varsa eskisini sil
        await prisma.verificationToken.deleteMany({
            where: { identifier: `reset:${email}` }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: `reset:${email}`,
                token,
                expires
            }
        });

        // Email gönderimi
        const resetUrl = `${process.env.NEXTAUTH_URL || "https://learnaxia.com"}/auth/reset-password?token=${token}`;

        await resend.emails.send({
            from: "Learnaxia <noreply@learnaxia.com>",
            to: email,
            subject: "Learnaxia Şifre Sıfırlama Talebi",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Şifre Sıfırlama Talebi</h2>
                    <p>Merhaba ${user.name || (user as any).handle || ""},</p>
                    <p>Hesabınızın şifresini sıfırlamak için bir talep aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Şifremi Sıfırla</a>
                    <p style="color: #666; font-size: 14px;">Bu talebi siz yapmadıysanız, bu e-postayı dikkate almayabilirsiniz. Bağlantı 1 saat boyunca geçerlidir.</p>
                </div>
            `
        });

        return NextResponse.json({ success: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!" });
    } catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
}
