import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ResetPasswordSchema } from "@learnaxia/shared";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, password } = ResetPasswordSchema.parse(body);

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Geçersiz veya kullanılmış bir bağlantı." }, { status: 400 });
        }

        if (verificationToken.expires < new Date()) {
            return NextResponse.json({ error: "Bu bağlantının süresi dolmuş. Lütfen tekrar şifre sıfırlama talebinde bulunun." }, { status: 400 });
        }

        if (!verificationToken.identifier.startsWith("reset:")) {
            return NextResponse.json({ error: "Geçersiz token türü." }, { status: 400 });
        }

        const email = verificationToken.identifier.replace("reset:", "");

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                sessionVersion: { increment: 1 } // Eski oturumları geçersiz kıl
            }
        });

        await prisma.verificationToken.delete({
            where: { token }
        });

        return NextResponse.json({ success: "Şifreniz başarıyla güncellendi!" });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
        }
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
}
