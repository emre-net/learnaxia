import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "E-posta adresi gereklidir." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Güvenlik: Kullanıcı yoksa bile "Gönderildi" de diyebiliriz ama şimdilik UX için hata verelim veya sessizce dönelim.
            return NextResponse.json({ success: "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir." });
        }

        const token = uuidv4();
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
                    <p>Merhaba ${user.name || user.handle || ""},</p>
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
