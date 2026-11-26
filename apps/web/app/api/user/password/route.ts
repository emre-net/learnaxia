import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ChangePasswordSchema } from "@learnaxia/shared";
import { z } from "zod";

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function POST(req: Request) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        if (!user.password) {
            return NextResponse.json(
                { error: "Google ile oluşturulan hesaplarda bu ekrandan şifre değiştirilemez." },
                { status: 400 }
            );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Mevcut şifreniz hatalı." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                sessionVersion: { increment: 1 },
            },
        });

        return NextResponse.json({ success: true, message: "Şifreniz başarıyla güncellendi." });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message || "Geçersiz veri" }, { status: 400 });
        }
        console.error("[CHANGE_PASSWORD]", error);
        return NextResponse.json({ error: "Şifre güncellenemedi" }, { status: 500 });
    }
}
